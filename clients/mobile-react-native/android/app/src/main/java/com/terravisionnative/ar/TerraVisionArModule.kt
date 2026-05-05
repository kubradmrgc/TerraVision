package com.terravisionnative.ar

import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TerraVisionArModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "TerraVisionAr"

    @ReactMethod
    fun launchArSession(
        modelUrl: String,
        modelFormat: String,
        placementHint: String,
        suggestedScale: Double,
        promise: Promise
    ) {
        try {
            if (!modelUrl.startsWith("https://", ignoreCase = true)) {
                promise.reject("INVALID_URL", "AR model URL must be https.")
                return
            }

            val sceneViewerUri = Uri.Builder()
                .scheme("https")
                .authority("arvr.google.com")
                .path("scene-viewer/1.0")
                .appendQueryParameter("file", modelUrl)
                .appendQueryParameter("mode", "ar_only")
                .build()

            val intent = Intent(Intent.ACTION_VIEW, sceneViewerUri)
            intent.setPackage("com.google.ar.core")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject("AR_LAUNCH_ERROR", error.message, error)
        }
    }
}
