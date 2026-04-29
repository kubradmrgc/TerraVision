package com.terravisionnative.ar

import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.net.URLEncoder

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

            val encodedFile = URLEncoder.encode(modelUrl, "UTF-8")
            val sceneViewerIntentUrl =
                "intent://arvr.google.com/scene-viewer/1.0?file=$encodedFile&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=$encodedFile;end;"

            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(sceneViewerIntentUrl))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject("AR_LAUNCH_ERROR", error.message, error)
        }
    }
}
