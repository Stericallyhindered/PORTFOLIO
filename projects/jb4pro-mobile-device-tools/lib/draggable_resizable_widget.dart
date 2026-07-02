import 'package:flutter/material.dart';
import 'dart:math' as math;

class DraggableResizableWidget extends StatefulWidget {
  final Widget child;
  final Offset initialPosition;
  final double initialScale;
  final double initialRotation;
  final void Function(Offset position, Size effectiveSize)? onPositionChanged;

  const DraggableResizableWidget({
    Key? key,
    required this.child,
    this.initialPosition = Offset.zero,
    this.initialScale = 1.0,
    this.initialRotation = 0.0,
    this.onPositionChanged,
  }) : super(key: key);

  @override
  _DraggableResizableWidgetState createState() =>
      _DraggableResizableWidgetState();
}

class _DraggableResizableWidgetState extends State<DraggableResizableWidget> {
  Offset position = Offset.zero;
  double scale = 1.0;
  double rotation = 0.0;
  bool editMode = false;

  // For pinch/rotate (dragging the entire widget)
  Offset? _initialFocalPoint;
  Offset? _initialPosition;
  double? _initialScale;
  double? _initialRotation;

  // For resizing via the handle (incremental updates)
  Offset? _prevResizePos;

  final FocusNode _focusNode = FocusNode();
  final GlobalKey _childKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    position = widget.initialPosition;
    scale = widget.initialScale;
    rotation = widget.initialRotation;

    // Exit edit mode when focus is lost.
    _focusNode.addListener(() {
      if (!_focusNode.hasFocus && editMode) {
        setState(() {
          editMode = false;
        });
      }
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  /// Enter edit mode (right-click for desktop, long-press for mobile).
  void _enterEditMode() {
    if (!_focusNode.hasFocus) {
      _focusNode.requestFocus();
    }
    setState(() {
      editMode = true;
    });
  }

  // ---- Pinch/Rotate for the entire widget ----
  void _onScaleStart(ScaleStartDetails details) {
    if (!editMode) return;
    _initialFocalPoint = details.focalPoint;
    _initialPosition = position;
    _initialScale = scale;
    _initialRotation = rotation;
  }

  void _onScaleUpdate(ScaleUpdateDetails details) {
    if (!editMode) return;
    setState(() {
      final delta = details.focalPoint - _initialFocalPoint!;
      position = _initialPosition! + delta;
      rotation = _initialRotation! + details.rotation;
      double newScale = _initialScale! * details.scale;
      scale = newScale.clamp(0.3, 5.0);
    });
    _notifyPositionChanged();
  }

  // ---- Incremental resizing with a handle ----
  void _onResizeStart(DragStartDetails details) {
    if (!editMode) return;
    _prevResizePos = details.globalPosition;
  }

  void _onResizeUpdate(DragUpdateDetails details) {
    if (!editMode || _prevResizePos == null) return;
    final offset = details.globalPosition - _prevResizePos!;
    _prevResizePos = details.globalPosition;
    final double delta = offset.dx + offset.dy;
    setState(() {
      double newScale = scale + (delta / 200.0);
      scale = newScale.clamp(0.3, 5.0);
    });
    _notifyPositionChanged();
  }

  // Reports the current position and effective size via the callback.
  void _notifyPositionChanged() {
    if (widget.onPositionChanged != null) {
      final RenderBox? renderBox =
          _childKey.currentContext?.findRenderObject() as RenderBox?;
      if (renderBox != null) {
        final Size childSize = renderBox.size;
        final Size effectiveSize =
            Size(childSize.width * scale, childSize.height * scale);
        widget.onPositionChanged!(position, effectiveSize);
      }
    }
  }

  // Build the resize handle at the bottom-right.
  Widget _buildResizeHandle() {
    return Positioned(
      right: 0,
      bottom: 0,
      child: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onPanStart: _onResizeStart,
        onPanUpdate: _onResizeUpdate,
        child: Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: Colors.blueAccent.withOpacity(0.8),
            border: Border.all(color: Colors.white, width: 1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: const Icon(
            Icons.open_with,
            size: 18,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: position.dx,
      top: position.dy,
      child: Focus(
        focusNode: _focusNode,
        child: GestureDetector(
          onSecondaryTap: _enterEditMode,
          onLongPress: _enterEditMode,
          onScaleStart: _onScaleStart,
          onScaleUpdate: _onScaleUpdate,
          child: Transform(
            alignment: Alignment.center,
            transform: Matrix4.identity()
              ..rotateZ(rotation)
              ..scale(scale),
            child: Container(
              key: _childKey,
              decoration: editMode
                  ? BoxDecoration(
                      border: Border.all(color: Colors.red, width: 2),
                    )
                  : null,
              child: Stack(
                children: [
                  widget.child,
                  if (editMode) _buildResizeHandle(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
