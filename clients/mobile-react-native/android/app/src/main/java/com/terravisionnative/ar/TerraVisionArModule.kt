package com.terravisionnative.ar

import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.terravisionnative.BuildConfig
import java.net.URI

class TerraVisionArModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "TerraVisionAr"

    /** Scene Viewer AR camera requires a public HTTPS glb URL (not content:// or LAN http). */
    private val devHttpsArDemoModel =
        "https://static.poly.pizza/7f84a768-ac30-48d4-9c5d-f760492e7867.glb"

    private fun isLanOrEmulatorHost(modelUrl: String): Boolean {
        return try {
            val host = URI(modelUrl).host?.lowercase() ?: return false
            host == "localhost" ||
                host == "127.0.0.1" ||
                host == "10.0.2.2" ||
                host.startsWith("192.168.") ||
                host.startsWith("10.")
        } catch (_: Exception) {
            false
        }
    }

    private fun resolveSceneViewerModelUrl(modelUrl: String): String {
        if (modelUrl.startsWith("https://", ignoreCase = true)) {
            return modelUrl
        }

        if (BuildConfig.DEBUG &&
            modelUrl.startsWith("http://", ignoreCase = true) &&
            isLanOrEmulatorHost(modelUrl)
        ) {
            return devHttpsArDemoModel
        }

        return modelUrl
    }

    private fun buildSceneViewerUri(modelUrl: String, title: String?, mode: String, placementHint: String): Uri {
        val builder = Uri.parse("https://arvr.google.com/scene-viewer/1.0").buildUpon()
            .appendQueryParameter("file", modelUrl)
            .appendQueryParameter("mode", mode)
        title?.takeIf { it.isNotBlank() }?.let {
            builder.appendQueryParameter("title", it)
        }
        if (placementHint.equals("ground", ignoreCase = true)) {
            builder.appendQueryParameter("vertical_placement", "0")
        }
        return builder.build()
    }

    private fun buildSceneViewerIntent(
        modelUrl: String,
        title: String?,
        mode: String,
        placementHint: String,
        targetPackage: String?,
        useViewerActivity: Boolean
    ): Intent {
        val uri = buildSceneViewerUri(modelUrl, title, mode, placementHint)
        return Intent(Intent.ACTION_VIEW, uri).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (useViewerActivity && targetPackage == GOOGLE_PACKAGE) {
                component = ComponentName(GOOGLE_PACKAGE, VIEWER_ACTIVITY)
            } else if (targetPackage != null) {
                setPackage(targetPackage)
            }
        }
    }

    private fun launchSceneViewer(modelUrl: String, title: String?, placementHint: String) {
        val sceneViewerModelUrl = resolveSceneViewerModelUrl(modelUrl)

        // 3d_preferred first: model opens in 3D, user taps "View in your space" and grants camera.
        // ar_preferred direct entry often fails on some Google app versions before camera permission.
        val launchPlans = listOf(
            LaunchPlan("3d_preferred", GOOGLE_PACKAGE, useViewerActivity = true),
            LaunchPlan("ar_preferred", GOOGLE_PACKAGE, useViewerActivity = true),
            LaunchPlan("3d_preferred", GOOGLE_PACKAGE, useViewerActivity = false),
            LaunchPlan("ar_preferred", GOOGLE_PACKAGE, useViewerActivity = false),
            LaunchPlan("ar_only", AR_CORE_PACKAGE, useViewerActivity = false)
        )

        var lastError: ActivityNotFoundException? = null
        for (plan in launchPlans) {
            val intent = buildSceneViewerIntent(
                sceneViewerModelUrl,
                title,
                plan.mode,
                placementHint,
                plan.targetPackage,
                plan.useViewerActivity
            )
            try {
                reactContext.startActivity(intent)
                return
            } catch (error: ActivityNotFoundException) {
                lastError = error
            }
        }

        throw IllegalStateException(
            "Google Scene Viewer bulunamadı. Play Store'dan Google uygulamasını ve Google Play Hizmetleri for AR (ARCore) yükleyin.",
            lastError
        )
    }

    @ReactMethod
    fun getArEnvironmentStatus(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val result = Arguments.createMap()

            try {
                val arCore = pm.getPackageInfo(AR_CORE_PACKAGE, 0)
                result.putBoolean("arCoreInstalled", true)
                result.putString("arCoreVersion", arCore.versionName ?: "")
            } catch (_: Exception) {
                result.putBoolean("arCoreInstalled", false)
                result.putString("arCoreVersion", "")
            }

            try {
                val google = pm.getPackageInfo(GOOGLE_PACKAGE, 0)
                val version = google.versionName ?: ""
                result.putBoolean("googleAppInstalled", true)
                result.putString("googleAppVersion", version)
                result.putBoolean("googleAppUpdateRecommended", shouldRecommendGoogleAppUpdate(version))
            } catch (_: Exception) {
                result.putBoolean("googleAppInstalled", false)
                result.putString("googleAppVersion", "")
                result.putBoolean("googleAppUpdateRecommended", true)
            }

            promise.resolve(result)
        } catch (error: Exception) {
            promise.reject("AR_ENV_ERROR", error.message, error)
        }
    }

    @ReactMethod
    fun launchArSession(
        modelUrl: String,
        modelFormat: String,
        placementHint: String,
        suggestedScale: Double,
        productTitle: String,
        promise: Promise
    ) {
        Thread {
            try {
                val isHttps = modelUrl.startsWith("https://", ignoreCase = true)
                val isDevHttp =
                    BuildConfig.DEBUG &&
                        modelUrl.startsWith("http://", ignoreCase = true) &&
                        isLanOrEmulatorHost(modelUrl)
                if (!isHttps && !isDevHttp) {
                    promise.reject(
                        "INVALID_URL",
                        "AR model adresi https olmalı (geliştirmede http://127.0.0.1 veya LAN IP kullanılabilir)."
                    )
                    return@Thread
                }

                launchSceneViewer(modelUrl, productTitle.ifBlank { null }, placementHint)
                promise.resolve(null)
            } catch (error: Exception) {
                promise.reject("AR_LAUNCH_ERROR", error.message, error)
            }
        }.start()
    }

    private data class LaunchPlan(
        val mode: String,
        val targetPackage: String,
        val useViewerActivity: Boolean
    )

    companion object {
        private const val GOOGLE_PACKAGE = "com.google.android.googlequicksearchbox"
        private const val AR_CORE_PACKAGE = "com.google.ar.core"
        private const val VIEWER_ACTIVITY = "com.google.ar.core.viewer.ViewerActivity"

        /** Google app 17.24–17.27 had Scene Viewer AR regressions; 17.28+ fixes camera AR. */
        private fun shouldRecommendGoogleAppUpdate(versionName: String): Boolean {
            val match = VERSION_PATTERN.find(versionName) ?: return false
            val major = match.groupValues[1].toIntOrNull() ?: return false
            val minor = match.groupValues[2].toIntOrNull() ?: return false
            return major == 17 && minor in 24..27
        }

        private val VERSION_PATTERN = Regex("""^(\d+)\.(\d+)""")
    }
}
