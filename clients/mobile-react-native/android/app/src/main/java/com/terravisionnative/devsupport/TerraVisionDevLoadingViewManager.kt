package com.terravisionnative.devsupport

import android.content.Context
import android.view.Gravity
import android.view.LayoutInflater
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.PopupWindow
import android.widget.ProgressBar
import android.widget.TextView
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.terravisionnative.R
import java.util.Locale
import kotlin.math.roundToInt

/**
 * Full-screen dev loading overlay: TerraVision logo with a progress bar underneath.
 * Replaces the default top "Bundling…" banner while Metro delivers the JS bundle.
 */
class TerraVisionDevLoadingViewManager(
    private val reactInstanceDevHelper: ReactInstanceDevHelper,
) : DevLoadingViewManager {

  private var popup: PopupWindow? = null
  private var progressBar: ProgressBar? = null
  private var statusView: TextView? = null

  override fun showMessage(message: String) {
    showMessage(message, color = null, backgroundColor = null, dismissButton = false)
  }

  override fun showMessage(
      message: String,
      color: Double?,
      backgroundColor: Double?,
      dismissButton: Boolean?,
  ) {
    if (!isEnabled) {
      return
    }
    UiThreadUtil.runOnUiThread {
      showInternal(localizeStatus(message))
    }
  }

  override fun updateProgress(status: String?, done: Int?, total: Int?, percent: Int?) {
    if (!isEnabled) {
      return
    }
    UiThreadUtil.runOnUiThread {
      val resolvedPercent =
          percent
              ?: if (done != null && total != null && total > 0) {
                ((done.toFloat() / total) * 100f).roundToInt()
              } else {
                null
              }
      applyProgress(localizeStatus(status), resolvedPercent)
    }
  }

  override fun hide() {
    if (isEnabled) {
      UiThreadUtil.runOnUiThread { hideInternal() }
    }
  }

  private fun showInternal(status: String) {
    if (popup?.isShowing == true) {
      statusView?.text = status
      return
    }

    val activity = reactInstanceDevHelper.currentActivity
    if (activity == null) {
      FLog.e(
          ReactConstants.TAG,
          "Unable to display TerraVision loading overlay because React activity is not available",
      )
      return
    }

    try {
      val inflater =
          activity.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
      val root =
          inflater.inflate(R.layout.terravision_dev_loading, null) as ViewGroup
      val progress = root.findViewById<ProgressBar>(R.id.loading_progress)
      val statusText = root.findViewById<TextView>(R.id.loading_status)
      statusText.text = status
      progress.isIndeterminate = true
      progress.progress = 0

      val window =
          PopupWindow(
              root,
              ViewGroup.LayoutParams.MATCH_PARENT,
              ViewGroup.LayoutParams.MATCH_PARENT,
          )
      window.isClippingEnabled = false
      window.showAtLocation(activity.window.decorView, Gravity.CENTER, 0, 0)

      popup = window
      progressBar = progress
      statusView = statusText
    } catch (e: WindowManager.BadTokenException) {
      FLog.e(
          ReactConstants.TAG,
          "Unable to display TerraVision loading overlay because React activity is not active",
      )
    }
  }

  private fun applyProgress(status: String, percent: Int?) {
    if (popup?.isShowing != true) {
      showInternal(status)
    } else {
      statusView?.text = status
    }

    val bar = progressBar ?: return
    if (percent == null) {
      bar.isIndeterminate = true
      return
    }

    bar.isIndeterminate = false
    bar.max = 100
    bar.progress = percent.coerceIn(0, 100)
  }

  private fun hideInternal() {
    val window = popup ?: return
    if (window.isShowing) {
      window.dismiss()
    }
    popup = null
    progressBar = null
    statusView = null
  }

  private fun localizeStatus(raw: String?): String {
    val key = raw?.trim().orEmpty()
    return when {
      key.isEmpty() -> "Yükleniyor…"
      key.equals("Bundling", ignoreCase = true) -> "Yükleniyor…"
      key.equals("Loading", ignoreCase = true) -> "Yükleniyor…"
      key.startsWith("Reloading", ignoreCase = true) -> "Yenileniyor…"
      else -> {
        val normalized = key.replaceFirstChar { ch ->
          if (ch.isLowerCase()) ch.titlecase(Locale.getDefault()) else ch.toString()
        }
        if (normalized.endsWith("…")) normalized else "$normalized…"
      }
    }
  }

  companion object {
    @Volatile private var isEnabled = true

    fun setDevLoadingEnabled(enabled: Boolean) {
      isEnabled = enabled
    }
  }
}
