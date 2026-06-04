package com.terravisionnative.devsupport

import android.content.Context
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager

internal class TerraVisionDevSupportManager(
    applicationContext: Context,
    reactInstanceManagerHelper: ReactInstanceDevHelper,
    packagerPathForJSBundleName: String?,
    devLoadingViewManager: DevLoadingViewManager,
) :
    DevSupportManagerBase(
        applicationContext,
        reactInstanceManagerHelper,
        packagerPathForJSBundleName,
        enableOnCreate = true,
        redBoxHandler = null,
        devBundleDownloadListener = null,
        minNumShakes = 2,
        customPackagerCommandHandlers = null,
        surfaceDelegateFactory = null,
        devLoadingViewManager = devLoadingViewManager,
        pausedInDebuggerOverlayManager = null,
    ) {

  override val uniqueTag: String
    get() = "TerraVision"

  override fun handleReloadJS() {
    UiThreadUtil.assertOnUiThread()
    hideRedboxDialog()
    reactInstanceDevHelper.reload("TerraVisionDevSupportManager.handleReloadJS()")
  }
}
