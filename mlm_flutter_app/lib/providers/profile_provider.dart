import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class ProfileProvider with ChangeNotifier {
  Map<String, dynamic>? _profileData;
  bool _isLoading = false;
  bool _hasTpin = false;

  Map<String, dynamic>? get profileData => _profileData;
  bool get isLoading => _isLoading;
  bool get hasTpin => _hasTpin;

  Future<void> fetchProfile() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token != null) {
        final response = await http.get(
          Uri.parse('${AppConstants.apiBaseUrl}/user/profile'),
          headers: {'Authorization': 'Bearer $token'},
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          if (data['success']) {
            _profileData = data['user'];
            _hasTpin = data['hasTpin'] ?? false;
            
            // Also update the local cached user so AuthProvider gets updated name/rank etc.
            await prefs.setString('user', jsonEncode(_profileData));
          }
        }
      }
    } catch (e) {
      print('Fetch profile error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> updateKyc(Map<String, String> kycData) async {
    _isLoading = true;
    notifyListeners();
    bool success = false;

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/user/kyc'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(kycData),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success']) {
        await fetchProfile(); // Refresh profile
        success = true;
      }
    } catch (e) {
      print('KYC update error: $e');
    }

    _isLoading = false;
    notifyListeners();
    return success;
  }

  Future<bool> changePassword(String currentPassword, String newPassword) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/user/change-password'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'currentPassword': currentPassword, 'newPassword': newPassword}),
      );

      return response.statusCode == 200 && jsonDecode(response.body)['success'];
    } catch (e) {
      print('Change password error: $e');
      return false;
    }
  }

  Future<bool> setTpin(String currentTpin, String newTpin) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/user/tpin'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'currentTpin': currentTpin, 'newTpin': newTpin}),
      );

      final success = response.statusCode == 200 && jsonDecode(response.body)['success'];
      if (success) {
        await fetchProfile(); // refresh hasTpin status
      }
      return success;
    } catch (e) {
      print('Set TPIN error: $e');
      return false;
    }
  }
}
