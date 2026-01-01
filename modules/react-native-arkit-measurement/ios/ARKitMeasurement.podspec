require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ARKitMeasurement'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platform       = :ios, '16.0'
  s.source         = { git: package['repository']['url'], tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.swift_version = '5.0'

  s.pod_target_xcconfig = {
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = "**/*.{h,m,mm,swift}"
end
