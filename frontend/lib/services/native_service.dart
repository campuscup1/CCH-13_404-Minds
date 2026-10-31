import 'package:flutter/services.dart';

class NativeService {
  static const MethodChannel _channel = MethodChannel('com.example.mediroute/driver_native');

  /// Trigger loud emergency buzzer sound and vibration alarm on mobile
  static Future<void> playBuzzer() async {
    try {
      await _channel.invokeMethod('playBuzzer');
    } catch (e) {
      // Fallback to HapticFeedback if platform channel fails
      HapticFeedback.heavyImpact();
    }
  }

  /// Stop buzzer alarm
  static Future<void> stopBuzzer() async {
    try {
      await _channel.invokeMethod('stopBuzzer');
    } catch (_) {}
  }

  /// Request runtime location permission from the device
  static Future<bool> requestLocationPermission() async {
    try {
      final res = await _channel.invokeMethod<bool>('requestLocationPermission');
      return res ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Check if location permission is granted
  static Future<bool> checkLocationPermission() async {
    try {
      final res = await _channel.invokeMethod<bool>('checkLocationPermission');
      return res ?? false;
    } catch (_) {
      return false;
    }
  }
}
