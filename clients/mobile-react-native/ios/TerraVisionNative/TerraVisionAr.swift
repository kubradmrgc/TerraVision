import Foundation
import UIKit
import React

@objc(TerraVisionAr)
class TerraVisionAr: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc(launchArSession:modelFormat:placementHint:suggestedScale:productTitle:resolver:rejecter:)
  func launchArSession(
    modelUrl: String,
    modelFormat: String,
    placementHint: String,
    suggestedScale: NSNumber,
    productTitle: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    _ = modelFormat
    _ = placementHint
    _ = suggestedScale
    _ = productTitle
    guard modelUrl.lowercased().hasPrefix("https://"), let url = URL(string: modelUrl) else {
      reject("INVALID_URL", "AR model URL must be https.", nil)
      return
    }

    DispatchQueue.main.async {
      if UIApplication.shared.canOpenURL(url) {
        UIApplication.shared.open(url) { success in
          if success {
            resolve(nil)
          } else {
            reject("AR_LAUNCH_ERROR", "Failed to open AR URL.", nil)
          }
        }
      } else {
        reject("AR_UNAVAILABLE", "Quick Look could not open this URL.", nil)
      }
    }
  }
}
