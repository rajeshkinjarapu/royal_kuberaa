import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../utils/constants.dart';

class PinInputBoxes extends StatefulWidget {
  final int length;
  final TextEditingController controller;
  final ValueChanged<String>? onCompleted;
  final ValueChanged<String>? onChanged;
  final bool obscureText;

  const PinInputBoxes({
    super.key,
    this.length = 6,
    required this.controller,
    this.onCompleted,
    this.onChanged,
    this.obscureText = true,
  });

  @override
  State<PinInputBoxes> createState() => _PinInputBoxesState();
}

class _PinInputBoxesState extends State<PinInputBoxes> {
  late List<TextEditingController> _boxControllers;
  late List<FocusNode> _focusNodes;

  @override
  void initState() {
    super.initState();
    _boxControllers = List.generate(widget.length, (_) => TextEditingController());
    _focusNodes = List.generate(widget.length, (_) => FocusNode());

    // Populate boxes if controller already has a value
    final initial = widget.controller.text;
    for (int i = 0; i < widget.length && i < initial.length; i++) {
      _boxControllers[i].text = initial[i];
    }
  }

  @override
  void dispose() {
    for (var c in _boxControllers) {
      c.dispose();
    }
    for (var f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _syncMainController() {
    final fullPin = _boxControllers.map((c) => c.text).join();
    widget.controller.text = fullPin;
    widget.onChanged?.call(fullPin);
    if (fullPin.length == widget.length) {
      widget.onCompleted?.call(fullPin);
    }
  }

  void _onDigitChanged(int index, String value) {
    if (value.length > 1) {
      // Pasted multiple digits
      final digits = value.replaceAll(RegExp(r'[^0-9]'), '');
      for (int i = 0; i < digits.length && (index + i) < widget.length; i++) {
        _boxControllers[index + i].text = digits[i];
      }
      final nextIndex = (index + digits.length).clamp(0, widget.length - 1);
      _focusNodes[nextIndex].requestFocus();
      _syncMainController();
      return;
    }

    if (value.isNotEmpty) {
      _boxControllers[index].text = value;
      if (index < widget.length - 1) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index].unfocus();
      }
    } else {
      _boxControllers[index].text = '';
    }
    _syncMainController();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(widget.length, (index) {
        return SizedBox(
          width: 44,
          height: 48,
          child: Focus(
            onKeyEvent: (node, event) {
              if (event is KeyDownEvent &&
                  event.logicalKey == LogicalKeyboardKey.backspace &&
                  _boxControllers[index].text.isEmpty &&
                  index > 0) {
                _focusNodes[index - 1].requestFocus();
                _boxControllers[index - 1].text = '';
                _syncMainController();
                return KeyEventResult.handled;
              }
              return KeyEventResult.ignored;
            },
            child: TextField(
              controller: _boxControllers[index],
              focusNode: _focusNodes[index],
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              obscureText: widget.obscureText,
              maxLength: 1,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
              ],
              decoration: InputDecoration(
                counterText: '',
                contentPadding: EdgeInsets.zero,
                filled: true,
                fillColor: const Color(0xFFFAFAFA),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFDC2626), width: 2),
                ),
              ),
              onChanged: (val) => _onDigitChanged(index, val),
            ),
          ),
        );
      }),
    );
  }
}
