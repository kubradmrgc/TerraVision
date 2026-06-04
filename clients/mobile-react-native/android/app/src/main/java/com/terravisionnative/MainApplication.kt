package com.terravisionnative

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    TerraVisionReactHost.getReactHost(applicationContext)
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
