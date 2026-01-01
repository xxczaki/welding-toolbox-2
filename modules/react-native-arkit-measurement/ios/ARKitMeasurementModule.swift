import ExpoModulesCore
import UIKit
import ARKit

public class ARKitMeasurementModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ARKitMeasurementModule")

    AsyncFunction("measureDistance") { (options: [String: Any]?, promise: Promise) in
      DispatchQueue.main.async {
        // Get root view controller from active window scene
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let viewController = windowScene.windows.first(where: { $0.isKeyWindow })?.rootViewController else {
          promise.reject("NO_VIEW_CONTROLLER", "Could not find root view controller")
          return
        }

        // Get the topmost presented view controller
        var topVC = viewController
        while let presented = topVC.presentedViewController {
          topVC = presented
        }

        if #available(iOS 13.0, *) {
          let measurementVC = ARMeasurementViewController()

          // Parse options
          if let opts = options {
            if let unit = opts["unit"] as? String {
              measurementVC.unit = unit
            }
          }

          measurementVC.onComplete = { result in
            promise.resolve(result)
          }
          measurementVC.onCancel = {
            promise.reject("USER_CANCELLED", "User cancelled measurement")
          }

          let navController = UINavigationController(rootViewController: measurementVC)
          navController.modalPresentationStyle = .fullScreen
          navController.isNavigationBarHidden = true
          topVC.present(navController, animated: true)
        } else {
          promise.reject("UNSUPPORTED", "AR measurement requires iOS 13.0 or later")
        }
      }
    }

    AsyncFunction("isSupported") { () -> Bool in
      if #available(iOS 13.0, *) {
        return ARWorldTrackingConfiguration.isSupported
      }
      return false
    }
  }
}
