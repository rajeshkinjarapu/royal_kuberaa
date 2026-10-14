import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class ProfileProvider with ChangeNotifier {
  Map<String, dynamic>? _profileData;
  bool _isLoading = false;
  bool _hasTpin = false;
  String _errorMessage = '';

  Map<String, dynamic>? get profileData => _profileData;
  bool get isLoading => _isLoading;
  bool get hasTpin => _hasTpin;
  String get errorMessage => _errorMessage;

  Future<void> fetchProfile() async {
    _isLoading = true;
    _errorMessage = '';
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
          } else {
            _errorMessage = data['message'] ?? 'Failed to load profile';
          }
        }
      }
    } catch (e) {
      _errorMessage = 'Fetch profile error: $e';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> uploadPaymentQr(File imageFile) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();
    bool success = false;

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      var request = http.MultipartRequest(
        'POST',
        Uri.parse('${AppConstants.apiBaseUrl}/user/upload-qr'),
      );
      request.headers['Authorization'] = 'Bearer $token';
      request.files.add(await http.MultipartFile.fromPath('qrImage', imageFile.path));

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);
      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success']) {
        await fetchProfile();
        success = true;
      } else {
        _errorMessage = data['message'] ?? 'Failed to upload QR code';
      }
    } catch (e) {
      _errorMessage = 'Upload error: $e';
    }

    _isLoading = false;
    notifyListeners();
    return success;
  }

  Future<bool> updatePaymentQr(String qrOrUpi) async {
    _isLoading = true;
    _errorMessage = '';
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
        body: jsonEncode({'paymentQrCode': qrOrUpi}),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success']) {
        await fetchProfile();
        success = true;
      } else {
        _errorMessage = data['message'] ?? 'Failed to update payment QR';
      }
    } catch (e) {
      _errorMessage = 'Payment QR update error: $e';
    }

    _isLoading = false;
    notifyListeners();
    return success;
  }

  Future<bool> updateKyc(Map<String, String> kycData) async {
    _isLoading = true;
    _errorMessage = '';
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
      } else {
        _errorMessage = data['message'] ?? 'Failed to update KYC';
      }
    } catch (e) {
      _errorMessage = 'KYC update error: $e';
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
