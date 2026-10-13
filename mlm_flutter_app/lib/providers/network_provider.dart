import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class NetworkProvider with ChangeNotifier {
  List<dynamic> _directs = [];
  Map<String, dynamic>? _treeData;
  List<dynamic> _rebirths = [];
  bool _isLoading = false;
  String _errorMessage = '';

  List<dynamic> get directs => _directs;
  Map<String, dynamic>? get treeData => _treeData;
  List<dynamic> get rebirths => _rebirths;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;

  Future<void> fetchDirects() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) throw Exception("Unauthorized");

      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/network/directs'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          _directs = data['data'] ?? data['directs'] ?? [];
        } else {
          _errorMessage = data['message'] ?? 'Failed to load network';
        }
      } else {
        _errorMessage = 'Server error: ${response.statusCode}';
      }
    } catch (e) {
      _errorMessage = 'An error occurred while fetching network data.';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchTree([String? memberId]) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) throw Exception("Unauthorized");

      final url = memberId != null 
          ? '${AppConstants.apiBaseUrl}/network/tree/$memberId'
          : '${AppConstants.apiBaseUrl}/network/tree';

      final response = await http.get(
        Uri.parse(url),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          _treeData = data['data'];
        } else {
          _errorMessage = data['message'] ?? 'Failed to load tree';
        }
      } else {
        _errorMessage = 'Server error: ${response.statusCode}';
      }
    } catch (e) {
      _errorMessage = 'An error occurred while fetching tree data.';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchRebirths() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) throw Exception("Unauthorized");

      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/network/rebirths'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success']) {
          _rebirths = data['data'] ?? [];
        } else {
          _errorMessage = data['message'] ?? 'Failed to load rebirths';
        }
      } else {
        _errorMessage = 'Server error: ${response.statusCode}';
      }
    } catch (e) {
      _errorMessage = 'An error occurred while fetching rebirths.';
    }

    _isLoading = false;
    notifyListeners();
  }
}
