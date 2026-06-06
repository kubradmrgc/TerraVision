package com.terravisionnative.ar

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
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
            // LAN/localhost models only render in 3D studio mode. Use public HTTPS for camera AR.
            return devHttpsArDemoModel
        }

        return modelUrl
    }

    private fun buildSceneViewerIntent(
        modelUrl: String,
        title: String?,
        mode: String,
        targetPackage: String?
    ): Intent {
        val builder = Uri.parse("https://arvr.google.com/scene-viewer/1.0").buildUpon()
            .appendQueryParameter("file", modelUrl)
            .appendQueryParameter("mode", mode)
        title?.takeIf { it.isNotBlank() }?.let {
            builder.appendQueryParameter("title", it)
        }

        return Intent(Intent.ACTION_VIEW, builder.build()).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (targetPackage != null) {
                setPackage(targetPackage)
            }
        }
    }

    private fun launchSceneViewer(modelUrl: String, title: String?) {
        val sceneViewerModelUrl = resolveSceneViewerModelUrl(modelUrl)
        val googlePackage = "com.google.android.googlequicksearchbox"
        val arCorePackage = "com.google.ar.core"

        // Google docs: ar_only must target com.google.ar.core; Google app uses ar_preferred.
        val launchPlans = listOf(
            buildSceneViewerIntent(sceneViewerModelUrl, title, "ar_preferred", googlePackage),
            buildSceneViewerIntent(sceneViewerModelUrl, title, "ar_only", arCorePackage),
            buildSceneViewerIntent(sceneViewerModelUrl, title, "ar_preferred", null)
        )

        var lastError: ActivityNotFoundException? = null
        for (intent in launchPlans) {
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

                launchSceneViewer(modelUrl, productTitle.ifBlank { null })
                promise.resolve(null)
            } catch (error: Exception) {
                promise.reject("AR_LAUNCH_ERROR", error.message, error)
            }
        }.start()
    }
}
