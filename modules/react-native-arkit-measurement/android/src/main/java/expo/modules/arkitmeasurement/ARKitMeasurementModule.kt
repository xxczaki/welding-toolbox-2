package expo.modules.arkitmeasurement

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ARKitMeasurementModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ARKitMeasurementModule")

    AsyncFunction("measureDistance") {
      throw UnsupportedOperationException("ARKit is only available on iOS")
    }

    AsyncFunction("isSupported") {
      return@AsyncFunction false
    }
  }
}
