package com.terravisionnative

import android.app.Application
import android.content.Context
import com.facebook.react.PackageList
import com.facebook.react.ReactHost
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.defaults.DefaultReactHostDelegate
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.hermes.HermesInstance
import com.terravisionnative.ar.TerraVisionArPackage
import com.terravisionnative.devsupport.TerraVisionDevSupportManagerFactory

object TerraVisionReactHost {
  @Volatile private var reactHost: ReactHost? = null

  @OptIn(UnstableReactNativeAPI::class)
  fun getReactHost(context: Context): ReactHost {
    reactHost?.let {
      return it
    }

    val application = context.applicationContext as Application
    val packageList =
        PackageList(application).packages.apply {
          add(TerraVisionArPackage())
        }

    val bundleLoader =
        JSBundleLoader.createAssetLoader(context, "assets://index.android.bundle", true)
    val turboModuleDelegateBuilder = DefaultTurboModuleManagerDelegate.Builder()
    val reactHostDelegate =
        DefaultReactHostDelegate(
            jsMainModulePath = "index",
            jsBundleLoader = bundleLoader,
            reactPackages = packageList,
            jsRuntimeFactory = HermesInstance(),
            bindingsInstaller = null,
            turboModuleManagerDelegateBuilder = turboModuleDelegateBuilder,
            exceptionHandler = { throw it },
        )
    val componentFactory = ComponentFactory()
    DefaultComponentsRegistry.register(componentFactory)

    val host =
        ReactHostImpl(
            context,
            reactHostDelegate,
            componentFactory,
            allowPackagerServerAccess = true,
            useDevSupport = ReactBuildConfig.DEBUG,
            devSupportManagerFactory = TerraVisionDevSupportManagerFactory(),
        )

    reactHost = host
    return host
  }
}
