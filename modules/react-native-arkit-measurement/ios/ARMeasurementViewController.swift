import UIKit
import ARKit
import SceneKit
import SwiftUI

class ARMeasurementViewController: UIViewController, ARSCNViewDelegate, ARCoachingOverlayViewDelegate {

  var onComplete: (([String: Any]) -> Void)?
  var onCancel: (() -> Void)?
  var unit: String = "mm"

  private var sceneView: ARSCNView!
  private var coachingOverlay: ARCoachingOverlayView!

  // UI Elements
  private var crosshairView: CrosshairView!
  private var instructionLabel: UILabel!
  private var totalLabelContainer: UIView!
  private var totalLabel: UILabel!
  private var addButton: UIButton!
  private var undoButton: UIButton!
  private var doneButton: UIButton!
  private var closeButton: UIButton!

  // Measurement state
  private var points: [SCNVector3] = []
  private var sphereNodes: [SCNNode] = []
  private var lineNodes: [SCNNode] = []
  private var labelNodes: [SCNNode] = []
  private var previewLineNode: SCNNode?
  private var previewLabelNode: SCNNode?

  // Current hit test result
  private var currentHitPoint: SCNVector3?
  private var lastUpdateTime: TimeInterval = 0
  private let updateInterval: TimeInterval = 1.0 / 20.0 // 20 fps for smooth updates

  override func viewDidLoad() {
    super.viewDidLoad()
    setupUI()
    setupARSession()
    setupCoachingOverlay()
  }

  private func setupUI() {
    view.backgroundColor = .black
    navigationController?.setNavigationBarHidden(true, animated: false)

    // AR Scene View
    sceneView = ARSCNView(frame: view.bounds)
    sceneView.delegate = self
    sceneView.autoenablesDefaultLighting = true
    sceneView.automaticallyUpdatesLighting = true
    sceneView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(sceneView)

    // Crosshair View (static, no tilt)
    crosshairView = CrosshairView(frame: CGRect(x: 0, y: 0, width: 60, height: 60))
    crosshairView.center = view.center
    crosshairView.autoresizingMask = [.flexibleTopMargin, .flexibleBottomMargin, .flexibleLeftMargin, .flexibleRightMargin]
    view.addSubview(crosshairView)

    // Total measurement label container (liquid glass)
    totalLabelContainer = UIView()
    totalLabelContainer.translatesAutoresizingMaskIntoConstraints = false
    totalLabelContainer.layer.cornerRadius = 16
    totalLabelContainer.clipsToBounds = true
    view.addSubview(totalLabelContainer)

    // Add glass background to container
    let totalGlassView = createGlassBackgroundFill(cornerRadius: 16)
    totalGlassView.translatesAutoresizingMaskIntoConstraints = false
    totalLabelContainer.addSubview(totalGlassView)
    NSLayoutConstraint.activate([
      totalGlassView.topAnchor.constraint(equalTo: totalLabelContainer.topAnchor),
      totalGlassView.bottomAnchor.constraint(equalTo: totalLabelContainer.bottomAnchor),
      totalGlassView.leadingAnchor.constraint(equalTo: totalLabelContainer.leadingAnchor),
      totalGlassView.trailingAnchor.constraint(equalTo: totalLabelContainer.trailingAnchor)
    ])

    // Total label (inside container)
    totalLabel = UILabel()
    totalLabel.text = "0.0 mm"
    totalLabel.textColor = .white
    totalLabel.font = UIFont.systemFont(ofSize: 15, weight: .semibold)
    totalLabel.textAlignment = .center
    totalLabel.layer.shadowColor = UIColor.black.cgColor
    totalLabel.layer.shadowOffset = CGSize(width: 0, height: 1)
    totalLabel.layer.shadowOpacity = 0.3
    totalLabel.layer.shadowRadius = 2
    totalLabel.translatesAutoresizingMaskIntoConstraints = false
    totalLabelContainer.addSubview(totalLabel)

    // Instruction Label
    instructionLabel = UILabel()
    instructionLabel.text = "Add a point"
    instructionLabel.textColor = .white
    instructionLabel.font = UIFont.systemFont(ofSize: 15, weight: .medium)
    instructionLabel.textAlignment = .center
    instructionLabel.layer.shadowColor = UIColor.black.cgColor
    instructionLabel.layer.shadowOffset = CGSize(width: 0, height: 1)
    instructionLabel.layer.shadowOpacity = 0.8
    instructionLabel.layer.shadowRadius = 3
    instructionLabel.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(instructionLabel)

    // Close Button (top left)
    closeButton = createGlassButton(systemName: "xmark")
    closeButton.addTarget(self, action: #selector(handleCancel), for: .touchUpInside)
    view.addSubview(closeButton)

    // Undo Button (bottom left)
    undoButton = createGlassButton(systemName: "arrow.uturn.backward")
    undoButton.addTarget(self, action: #selector(handleUndo), for: .touchUpInside)
    undoButton.alpha = 0
    view.addSubview(undoButton)

    // Add Button (bottom center)
    addButton = createAddButton()
    addButton.addTarget(self, action: #selector(handleAddPoint), for: .touchUpInside)
    view.addSubview(addButton)

    // Done Button (bottom right)
    doneButton = createGlassButton(systemName: "checkmark")
    doneButton.addTarget(self, action: #selector(handleDone), for: .touchUpInside)
    doneButton.alpha = 0
    view.addSubview(doneButton)

    setupConstraints()
    updateTotalLabel()
  }

  private func createGlassButton(systemName: String) -> UIButton {
    let size: CGFloat = 50

    let button = UIButton(type: .custom)
    button.translatesAutoresizingMaskIntoConstraints = false

    // Glass background - use SwiftUI glassEffect on iOS 26+, fallback to UIVisualEffectView
    let glassView = createGlassBackground(size: size, cornerRadius: size / 2)
    glassView.frame = CGRect(x: 0, y: 0, width: size, height: size)
    glassView.isUserInteractionEnabled = false
    button.addSubview(glassView)

    // Icon
    let config = UIImage.SymbolConfiguration(pointSize: 17, weight: .semibold)
    let imageView = UIImageView(image: UIImage(systemName: systemName, withConfiguration: config))
    imageView.tintColor = .white
    imageView.contentMode = .center
    imageView.frame = CGRect(x: 0, y: 0, width: size, height: size)
    button.addSubview(imageView)

    NSLayoutConstraint.activate([
      button.widthAnchor.constraint(equalToConstant: size),
      button.heightAnchor.constraint(equalToConstant: size)
    ])

    return button
  }

  private func createGlassBackground(size: CGFloat, cornerRadius: CGFloat) -> UIView {
    if #available(iOS 26.0, *) {
      // Use SwiftUI's liquid glass effect
      let glassView = GlassBackgroundView(size: size, cornerRadius: cornerRadius)
      let hostingController = UIHostingController(rootView: glassView)
      hostingController.view.backgroundColor = .clear
      hostingController.view.frame = CGRect(x: 0, y: 0, width: size, height: size)
      return hostingController.view
    } else {
      // Fallback to UIVisualEffectView
      let blurEffect = UIBlurEffect(style: .systemThinMaterialDark)
      let blurView = UIVisualEffectView(effect: blurEffect)
      blurView.frame = CGRect(x: 0, y: 0, width: size, height: size)
      blurView.layer.cornerRadius = cornerRadius
      blurView.clipsToBounds = true
      return blurView
    }
  }

  private func createGlassBackgroundFill(cornerRadius: CGFloat) -> UIView {
    if #available(iOS 26.0, *) {
      // Use SwiftUI's liquid glass effect
      let glassView = GlassBackgroundFillView(cornerRadius: cornerRadius)
      let hostingController = UIHostingController(rootView: glassView)
      hostingController.view.backgroundColor = .clear
      return hostingController.view
    } else {
      // Fallback to UIVisualEffectView
      let blurEffect = UIBlurEffect(style: .systemThinMaterialDark)
      let blurView = UIVisualEffectView(effect: blurEffect)
      blurView.layer.cornerRadius = cornerRadius
      blurView.clipsToBounds = true
      return blurView
    }
  }

  private func createAddButton() -> UIButton {
    let size: CGFloat = 66

    let button = UIButton(type: .custom)
    button.translatesAutoresizingMaskIntoConstraints = false

    // Glass background - use SwiftUI glassEffect on iOS 26+, fallback to UIVisualEffectView
    let glassView = createGlassBackground(size: size, cornerRadius: size / 2)
    glassView.frame = CGRect(x: 0, y: 0, width: size, height: size)
    glassView.isUserInteractionEnabled = false
    button.addSubview(glassView)

    // Plus icon (white for contrast on glass)
    let config = UIImage.SymbolConfiguration(pointSize: 28, weight: .medium)
    let imageView = UIImageView(image: UIImage(systemName: "plus", withConfiguration: config))
    imageView.tintColor = .white
    imageView.contentMode = .center
    imageView.frame = CGRect(x: 0, y: 0, width: size, height: size)
    imageView.layer.shadowColor = UIColor.black.cgColor
    imageView.layer.shadowOffset = CGSize(width: 0, height: 1)
    imageView.layer.shadowOpacity = 0.3
    imageView.layer.shadowRadius = 2
    button.addSubview(imageView)

    NSLayoutConstraint.activate([
      button.widthAnchor.constraint(equalToConstant: size),
      button.heightAnchor.constraint(equalToConstant: size)
    ])

    return button
  }

  private func setupConstraints() {
    NSLayoutConstraint.activate([
      // Close button (top left)
      closeButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
      closeButton.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 16),

      // Total label container (top center) - always visible
      totalLabelContainer.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
      totalLabelContainer.centerXAnchor.constraint(equalTo: view.centerXAnchor),
      totalLabelContainer.heightAnchor.constraint(equalToConstant: 32),

      // Total label inside container with symmetric padding
      totalLabel.topAnchor.constraint(equalTo: totalLabelContainer.topAnchor),
      totalLabel.bottomAnchor.constraint(equalTo: totalLabelContainer.bottomAnchor),
      totalLabel.leadingAnchor.constraint(equalTo: totalLabelContainer.leadingAnchor, constant: 14),
      totalLabel.trailingAnchor.constraint(equalTo: totalLabelContainer.trailingAnchor, constant: -14),

      // Instruction label (above add button)
      instructionLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
      instructionLabel.bottomAnchor.constraint(equalTo: addButton.topAnchor, constant: -20),

      // Undo button (bottom left)
      undoButton.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 40),
      undoButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -40),

      // Add button (bottom center)
      addButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
      addButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -40),

      // Done button (bottom right)
      doneButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -40),
      doneButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -40)
    ])
  }

  private func setupCoachingOverlay() {
    coachingOverlay = ARCoachingOverlayView()
    coachingOverlay.delegate = self
    coachingOverlay.session = sceneView.session
    coachingOverlay.goal = .anyPlane
    coachingOverlay.activatesAutomatically = true

    // Add to main view (not sceneView) with proper frame
    coachingOverlay.frame = view.bounds
    coachingOverlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(coachingOverlay)
  }

  private func setupARSession() {
    let configuration = ARWorldTrackingConfiguration()
    configuration.planeDetection = [.horizontal, .vertical]
    if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) {
      configuration.frameSemantics.insert(.sceneDepth)
    }
    sceneView.session.run(configuration)
  }

  // MARK: - ARSCNViewDelegate

  func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
    guard time - lastUpdateTime >= updateInterval else { return }
    lastUpdateTime = time

    DispatchQueue.main.async { [weak self] in
      self?.updateHitTest()
      self?.updatePreviewLine()
    }
  }

  private func updateHitTest() {
    let screenCenter = CGPoint(x: view.bounds.midX, y: view.bounds.midY)

    guard let query = sceneView.raycastQuery(from: screenCenter, allowing: .estimatedPlane, alignment: .any),
          let result = sceneView.session.raycast(query).first else {
      currentHitPoint = nil
      crosshairView.setDetected(false)
      return
    }

    currentHitPoint = SCNVector3(
      result.worldTransform.columns.3.x,
      result.worldTransform.columns.3.y,
      result.worldTransform.columns.3.z
    )
    crosshairView.setDetected(true)
  }

  private func updatePreviewLine() {
    guard let lastPoint = points.last, let currentPoint = currentHitPoint else {
      previewLineNode?.isHidden = true
      previewLabelNode?.isHidden = true
      return
    }

    // Create or update preview line
    if previewLineNode == nil {
      previewLineNode = SCNNode()
      sceneView.scene.rootNode.addChildNode(previewLineNode!)
    }

    // Update line geometry
    let lineGeometry = createLineGeometry(from: lastPoint, to: currentPoint, color: UIColor.white.withAlphaComponent(0.6))
    previewLineNode?.geometry = lineGeometry
    previewLineNode?.isHidden = false

    // Calculate and show preview distance
    let distance = calculateDistance(from: lastPoint, to: currentPoint)
    let midpoint = SCNVector3(
      (lastPoint.x + currentPoint.x) / 2,
      (lastPoint.y + currentPoint.y) / 2 + 0.015,
      (lastPoint.z + currentPoint.z) / 2
    )

    if previewLabelNode == nil {
      previewLabelNode = createLabelNode(text: formatDistance(distance), at: midpoint)
      sceneView.scene.rootNode.addChildNode(previewLabelNode!)
    } else {
      previewLabelNode?.position = midpoint
      updateLabelNode(previewLabelNode!, text: formatDistance(distance))
    }
    previewLabelNode?.isHidden = false
  }

  // MARK: - Actions

  @objc private func handleAddPoint() {
    guard let position = currentHitPoint else { return }

    points.append(position)

    // Create white sphere
    let sphere = SCNSphere(radius: 0.004)
    let material = SCNMaterial()
    material.diffuse.contents = UIColor.white
    material.lightingModel = .constant
    sphere.materials = [material]

    let sphereNode = SCNNode(geometry: sphere)
    sphereNode.position = position
    sceneView.scene.rootNode.addChildNode(sphereNode)
    sphereNodes.append(sphereNode)

    // Draw line between last two points
    if points.count >= 2 {
      let start = points[points.count - 2]
      let end = points[points.count - 1]

      // Create solid white line
      let lineGeometry = createLineGeometry(from: start, to: end, color: .white)
      let lineNode = SCNNode(geometry: lineGeometry)
      sceneView.scene.rootNode.addChildNode(lineNode)
      lineNodes.append(lineNode)

      // Create segment label
      let distance = calculateDistance(from: start, to: end)
      let midpoint = SCNVector3(
        (start.x + end.x) / 2,
        (start.y + end.y) / 2 + 0.012,
        (start.z + end.z) / 2
      )
      let labelNode = createLabelNode(text: formatDistance(distance), at: midpoint)
      sceneView.scene.rootNode.addChildNode(labelNode)
      labelNodes.append(labelNode)

      // Clear preview
      previewLineNode?.removeFromParentNode()
      previewLineNode = nil
      previewLabelNode?.removeFromParentNode()
      previewLabelNode = nil
    }

    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    updateUIState()
  }

  @objc private func handleUndo() {
    guard !points.isEmpty else { return }

    points.removeLast()
    sphereNodes.popLast()?.removeFromParentNode()
    lineNodes.popLast()?.removeFromParentNode()
    labelNodes.popLast()?.removeFromParentNode()

    previewLineNode?.removeFromParentNode()
    previewLineNode = nil
    previewLabelNode?.removeFromParentNode()
    previewLabelNode = nil

    UIImpactFeedbackGenerator(style: .light).impactOccurred()
    updateUIState()
  }

  @objc private func handleDone() {
    guard points.count >= 2 else { return }

    var segments: [Double] = []
    var total: Double = 0

    for i in 0..<(points.count - 1) {
      let distance = calculateDistance(from: points[i], to: points[i + 1])
      segments.append(distance)
      total += distance
    }

    let result: [String: Any] = [
      "distance": total,
      "unit": unit,
      "segments": segments
    ]

    UINotificationFeedbackGenerator().notificationOccurred(.success)

    dismiss(animated: true) { [weak self] in
      self?.onComplete?(result)
    }
  }

  @objc private func handleCancel() {
    dismiss(animated: true) { [weak self] in
      self?.onCancel?()
    }
  }

  private func updateUIState() {
    let hasPoints = !points.isEmpty
    let canFinish = points.count >= 2

    UIView.animate(withDuration: 0.2) {
      self.undoButton.alpha = hasPoints ? 1 : 0
      self.doneButton.alpha = canFinish ? 1 : 0
    }

    if points.isEmpty {
      instructionLabel.text = "Add a point"
    } else if points.count == 1 {
      instructionLabel.text = "Add another point"
    } else {
      instructionLabel.text = "Add more or tap ✓"
    }

    updateTotalLabel()
  }

  private func updateTotalLabel() {
    var total: Double = 0
    for i in 0..<max(0, points.count - 1) {
      total += calculateDistance(from: points[i], to: points[i + 1])
    }
    totalLabel.text = formatDistance(total)
  }

  // MARK: - Geometry Helpers

  private func createLineGeometry(from start: SCNVector3, to end: SCNVector3, color: UIColor) -> SCNGeometry {
    let vertices: [SCNVector3] = [start, end]
    let indices: [Int32] = [0, 1]

    let source = SCNGeometrySource(vertices: vertices)
    let element = SCNGeometryElement(indices: indices, primitiveType: .line)

    let geometry = SCNGeometry(sources: [source], elements: [element])
    let material = SCNMaterial()
    material.diffuse.contents = color
    material.lightingModel = .constant
    geometry.materials = [material]

    return geometry
  }

  private func calculateDistance(from start: SCNVector3, to end: SCNVector3) -> Double {
    let dx = end.x - start.x
    let dy = end.y - start.y
    let dz = end.z - start.z
    let meters = Double(sqrt(dx * dx + dy * dy + dz * dz))

    return unit == "in" ? meters * 39.3701 : meters * 1000.0
  }

  private func formatDistance(_ distance: Double) -> String {
    return unit == "in" ? String(format: "%.2f in", distance) : String(format: "%.1f mm", distance)
  }

  private func createLabelNode(text: String, at position: SCNVector3) -> SCNNode {
    let padding: CGFloat = 6
    let font = UIFont.systemFont(ofSize: 12, weight: .semibold)
    let textSize = (text as NSString).size(withAttributes: [.font: font])
    let width = textSize.width + padding * 2
    let height = textSize.height + padding

    let renderer = UIGraphicsImageRenderer(size: CGSize(width: width, height: height))
    let image = renderer.image { _ in
      UIBezierPath(roundedRect: CGRect(x: 0, y: 0, width: width, height: height), cornerRadius: height / 2).fill(with: .normal, alpha: 1)
      UIColor.white.setFill()
      UIBezierPath(roundedRect: CGRect(x: 0, y: 0, width: width, height: height), cornerRadius: height / 2).fill()

      let attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: UIColor.black]
      text.draw(at: CGPoint(x: padding, y: padding / 2), withAttributes: attrs)
    }

    // Convert to meters with minimum size limit (like Apple's Measure app)
    let minWidth: CGFloat = 0.025 // 2.5cm minimum width
    let minHeight: CGFloat = 0.012 // 1.2cm minimum height
    let planeWidth = max(width / 1000, minWidth)
    let planeHeight = max(height / 1000, minHeight)

    let plane = SCNPlane(width: planeWidth, height: planeHeight)
    plane.firstMaterial?.diffuse.contents = image
    plane.firstMaterial?.lightingModel = .constant
    plane.firstMaterial?.isDoubleSided = true

    let node = SCNNode(geometry: plane)
    node.position = position
    node.constraints = [SCNBillboardConstraint()]

    return node
  }

  private func updateLabelNode(_ node: SCNNode, text: String) {
    guard let plane = node.geometry as? SCNPlane else { return }

    let padding: CGFloat = 6
    let font = UIFont.systemFont(ofSize: 12, weight: .semibold)
    let textSize = (text as NSString).size(withAttributes: [.font: font])
    let width = textSize.width + padding * 2
    let height = textSize.height + padding

    let renderer = UIGraphicsImageRenderer(size: CGSize(width: width, height: height))
    let image = renderer.image { _ in
      UIColor.white.setFill()
      UIBezierPath(roundedRect: CGRect(x: 0, y: 0, width: width, height: height), cornerRadius: height / 2).fill()

      let attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: UIColor.black]
      text.draw(at: CGPoint(x: padding, y: padding / 2), withAttributes: attrs)
    }

    // Apply minimum size limit
    let minWidth: CGFloat = 0.025
    let minHeight: CGFloat = 0.012
    plane.width = max(width / 1000, minWidth)
    plane.height = max(height / 1000, minHeight)
    plane.firstMaterial?.diffuse.contents = image
  }

  // MARK: - ARCoachingOverlayViewDelegate

  func coachingOverlayViewWillActivate(_ coachingOverlayView: ARCoachingOverlayView) {
    [crosshairView, addButton, instructionLabel, closeButton, totalLabelContainer, undoButton, doneButton].forEach { $0?.isHidden = true }
  }

  func coachingOverlayViewDidDeactivate(_ coachingOverlayView: ARCoachingOverlayView) {
    // Unhide all UI elements (undo/done visibility will be controlled by alpha in updateUIState)
    [crosshairView, addButton, instructionLabel, closeButton, totalLabelContainer, undoButton, doneButton].forEach { $0?.isHidden = false }
    updateUIState() // Restore undo/done button visibility based on state
  }

  func coachingOverlayViewDidRequestSessionReset(_ coachingOverlayView: ARCoachingOverlayView) {
    // Clear all measurement state
    points.removeAll()
    sphereNodes.forEach { $0.removeFromParentNode() }
    sphereNodes.removeAll()
    lineNodes.forEach { $0.removeFromParentNode() }
    lineNodes.removeAll()
    labelNodes.forEach { $0.removeFromParentNode() }
    labelNodes.removeAll()
    previewLineNode?.removeFromParentNode()
    previewLineNode = nil
    previewLabelNode?.removeFromParentNode()
    previewLabelNode = nil
    currentHitPoint = nil

    // Reset the AR session
    let configuration = ARWorldTrackingConfiguration()
    configuration.planeDetection = [.horizontal, .vertical]
    if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) {
      configuration.frameSemantics.insert(.sceneDepth)
    }
    sceneView.session.run(configuration, options: [.resetTracking, .removeExistingAnchors])

    // Reset UI
    updateUIState()
    updateTotalLabel()
  }

  override func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)
    sceneView.session.pause()
  }

  deinit {
    sceneView?.session.pause()
  }
}

// MARK: - CrosshairView

class CrosshairView: UIView {
  private let ringLayer = CAShapeLayer()
  private let dotLayer = CAShapeLayer()

  override init(frame: CGRect) {
    super.init(frame: frame)
    setup()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setup()
  }

  private func setup() {
    backgroundColor = .clear

    ringLayer.fillColor = UIColor.clear.cgColor
    ringLayer.strokeColor = UIColor.white.cgColor
    ringLayer.lineWidth = 1.5
    layer.addSublayer(ringLayer)

    dotLayer.fillColor = UIColor.white.cgColor
    layer.addSublayer(dotLayer)

    // Add shadow for visibility on any background
    layer.shadowColor = UIColor.black.cgColor
    layer.shadowOffset = .zero
    layer.shadowOpacity = 0.5
    layer.shadowRadius = 3

    layoutLayers()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    layoutLayers()
  }

  private func layoutLayers() {
    let center = CGPoint(x: bounds.midX, y: bounds.midY)
    let radius = min(bounds.width, bounds.height) / 2 - 4

    ringLayer.path = UIBezierPath(arcCenter: center, radius: radius, startAngle: 0, endAngle: .pi * 2, clockwise: true).cgPath
    dotLayer.path = UIBezierPath(arcCenter: center, radius: 2, startAngle: 0, endAngle: .pi * 2, clockwise: true).cgPath
  }

  func setDetected(_ detected: Bool) {
    let newAlpha: CGFloat = detected ? 1.0 : 0.4
    guard alpha != newAlpha else { return }
    UIView.animate(withDuration: 0.15) { self.alpha = newAlpha }
  }
}

// MARK: - SwiftUI Glass Background (iOS 26+)

@available(iOS 26.0, *)
struct GlassBackgroundView: View {
  let size: CGFloat
  let cornerRadius: CGFloat

  var body: some View {
    Circle()
      .fill(.clear)
      .frame(width: size, height: size)
      .glassEffect(.regular.interactive())
  }
}

@available(iOS 26.0, *)
struct GlassBackgroundFillView: View {
  let cornerRadius: CGFloat

  var body: some View {
    RoundedRectangle(cornerRadius: cornerRadius)
      .fill(.clear)
      .glassEffect(.regular)
  }
}
