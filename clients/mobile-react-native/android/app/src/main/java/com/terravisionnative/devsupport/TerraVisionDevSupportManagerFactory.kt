package com.terravisionnative.devsupport

import android.content.Context
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.ReleaseDevSupportManager
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler

class TerraVisionDevSupportManagerFactory : DevSupportManagerFactory {

  @Deprecated(
      "Bridgeless apps should use the create() overload with useDevSupport.",
      ReplaceWith(
          "create(applicationContext, reactInstanceManagerHelper, packagerPathForJSBundleName, enableOnCreate, redBoxHandler, devBundleDownloadListener, minNumShakes, customPackagerCommandHandlers, surfaceDelegateFactory, devLoadingViewManager, pausedInDebuggerOverlayManager, useDevSupport = true)"
      ),
  )
  override fun create(
      applicationContext: Context,
      reactInstanceManagerHelper: ReactInstanceDevHelper,
      packagerPathForJSBundleName: String?,
      enableOnCreate: Boolean,
      redBoxHandler: RedBoxHandler?,
      devBundleDownloadListener: DevBundleDownloadListener?,
      minNumShakes: Int,
      customPackagerCommandHandlers: Map<String, RequestHandler>?,
      surfaceDelegateFactory: SurfaceDelegateFactory?,
      devLoadingViewManager: DevLoadingViewManager?,
      pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?,
  ): DevSupportManager {
    if (!enableOnCreate) {
      return ReleaseDevSupportManager()
    }
    val loadingView =
        devLoadingViewManager
            ?: TerraVisionDevLoadingViewManager(reactInstanceManagerHelper)
    return TerraVisionDevSupportManager(
        applicationContext = applicationContext,
        reactInstanceManagerHelper = reactInstanceManagerHelper,
        packagerPathForJSBundleName = packagerPathForJSBundleName,
        devLoadingViewManager = loadingView,
    )
  }

  override fun create(
      applicationContext: Context,
      reactInstanceManagerHelper: ReactInstanceDevHelper,
      packagerPathForJSBundleName: String?,
      enableOnCreate: Boolean,
      redBoxHandler: RedBoxHandler?,
      devBundleDownloadListener: DevBundleDownloadListener?,
      minNumShakes: Int,
      customPackagerCommandHandlers: Map<String, RequestHandler>?,
      surfaceDelegateFactory: SurfaceDelegateFactory?,
      devLoadingViewManager: DevLoadingViewManager?,
      pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?,
      useDevSupport: Boolean,
  ): DevSupportManager {
    if (ReactBuildConfig.UNSTABLE_ENABLE_FUSEBOX_RELEASE) {
      return ReleaseDevSupportManager()
    }
    if (!useDevSupport) {
      return ReleaseDevSupportManager()
    }

    val loadingView =
        devLoadingViewManager
            ?: TerraVisionDevLoadingViewManager(reactInstanceManagerHelper)

    return TerraVisionDevSupportManager(
        applicationContext = applicationContext,
        reactInstanceManagerHelper = reactInstanceManagerHelper,
        packagerPathForJSBundleName = packagerPathForJSBundleName,
        devLoadingViewManager = loadingView,
    )
  }
}
