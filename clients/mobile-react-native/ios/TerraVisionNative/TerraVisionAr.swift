import Foundation
import QuickLook
import UIKit
import React

@objc(TerraVisionAr)
class TerraVisionAr: NSObject, QLPreviewControllerDataSource, QLPreviewControllerDelegate {
  private var previewFileUrl: URL?
  private var activePreviewController: QLPreviewController?

  @objc
  static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc(launchArSession:modelFormat:placementHint:suggestedScale:resolver:rejecter:)
  func launchArSession(
    modelUrl: String,
    modelFormat: String,
    placementHint: String,
    suggestedScale: NSNumber,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard modelFormat.lowercased() == "usdz" else {
      reject("UNSUPPORTED_FORMAT", "iOS Quick Look supports USDZ models.", nil)
      return
    }

    guard modelUrl.lowercased().hasPrefix("https://"), let url = URL(string: modelUrl) else {
      reject("INVALID_URL", "AR model URL must be https.", nil)
      return
    }

    downloadUsdModel(from: url) { [weak self] result in
      switch result {
      case .success(let localUrl):
        DispatchQueue.main.async {
          self?.presentQuickLook(
            localUrl: localUrl,
            resolve: resolve,
            reject: reject
          )
        }
      case .failure(let error):
        reject("AR_DOWNLOAD_ERROR", error.localizedDescription, error)
      }
    }
  }

  private func downloadUsdModel(from url: URL, completion: @escaping (Result<URL, Error>) -> Void) {
    let task = URLSession.shared.downloadTask(with: url) { temporaryUrl, response, error in
      if let error = error {
        completion(.failure(error))
        return
      }

      if let statusCode = (response as? HTTPURLResponse)?.statusCode,
         statusCode < 200 || statusCode >= 300 {
        completion(.failure(NSError(
          domain: "TerraVisionAr",
          code: statusCode,
          userInfo: [NSLocalizedDescriptionKey: "AR model download failed with HTTP \(statusCode)."]
        )))
        return
      }

      guard let temporaryUrl = temporaryUrl else {
        completion(.failure(NSError(
          domain: "TerraVisionAr",
          code: -1,
          userInfo: [NSLocalizedDescriptionKey: "AR model download did not return a file."]
        )))
        return
      }

      do {
        let destinationUrl = FileManager.default.temporaryDirectory
          .appendingPathComponent("terravision-\(UUID().uuidString)")
          .appendingPathExtension("usdz")
        try FileManager.default.moveItem(at: temporaryUrl, to: destinationUrl)
        completion(.success(destinationUrl))
      } catch {
        completion(.failure(error))
      }
    }

    task.resume()
  }

  private func presentQuickLook(
    localUrl: URL,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let presenter = Self.topViewController() else {
      reject("AR_UNAVAILABLE", "Quick Look could not find a view controller to present from.", nil)
      return
    }

    previewFileUrl = localUrl

    let previewController = QLPreviewController()
    previewController.dataSource = self
    previewController.delegate = self
    activePreviewController = previewController

    presenter.present(previewController, animated: true) {
      resolve(nil)
    }
  }

  func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
    previewFileUrl == nil ? 0 : 1
  }

  func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
    previewFileUrl! as NSURL
  }

  func previewControllerDidDismiss(_ controller: QLPreviewController) {
    if controller === activePreviewController {
      if let previewFileUrl = previewFileUrl {
        try? FileManager.default.removeItem(at: previewFileUrl)
      }

      self.previewFileUrl = nil
      activePreviewController = nil
    }
  }

  private static func topViewController() -> UIViewController? {
    guard var topController = UIApplication.shared.connectedScenes
      .compactMap({ $0 as? UIWindowScene })
      .flatMap({ $0.windows })
      .first(where: { $0.isKeyWindow })?
      .rootViewController else {
        return nil
      }

    while true {
      if let navigationController = topController as? UINavigationController,
         let visibleController = navigationController.visibleViewController {
        topController = visibleController
        continue
      }

      if let tabBarController = topController as? UITabBarController,
         let selectedController = tabBarController.selectedViewController {
        topController = selectedController
        continue
      }

      if let presentedController = topController.presentedViewController {
        topController = presentedController
        continue
      }

      return topController
    }
  }
}
