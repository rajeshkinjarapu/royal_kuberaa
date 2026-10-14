import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class AdminProvider with ChangeNotifier {
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  List<dynamic> _users = [];
  List<dynamic> get users => _users;

  List<dynamic> _fundRequests = [];
  List<dynamic> get fundRequests => _fundRequests;

  List<dynamic> _withdrawals = [];
  List<dynamic> get withdrawals => _withdrawals;

  List<dynamic> _kycRequests = [];
  List<dynamic> get kycRequests => _kycRequests;

  Future<void> fetchUsers() async {
    _setLoading(true);
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/users'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        _users = jsonDecode(response.body)['data'] ?? [];
      }
    } catch (e) {
      print('Error fetching users: $e');
    }
    _setLoading(false);
  }

  Future<bool> toggleUserBlock(String userId) async {
    try {
      final token = await _getToken();
      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/users/$userId/toggle-block'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200 && jsonDecode(response.body)['success']) {
        await fetchUsers();
        return true;
      }
    } catch (e) {
      print('Error toggling block: $e');
    }
    return false;
  }

  Future<bool> activateUser(String memberId) async {
    try {
      final token = await _getToken();
      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/user/activate'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'targetMemberId': memberId}),
      );
      if (response.statusCode == 200 && jsonDecode(response.body)['success']) {
        await fetchUsers();
        return true;
      }
    } catch (e) {
      print('Error activating user: $e');
    }
    return false;
  }

  Future<void> fetchFundRequests() async {
    _setLoading(true);
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/fund-requests'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        _fundRequests = jsonDecode(response.body)['data'] ?? [];
      }
    } catch (e) {
      print('Error fetching fund requests: $e');
    }
    _setLoading(false);
  }

  Future<bool> processFundRequest(String requestId, String action) async {
    try {
      final token = await _getToken();
      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/fund-requests/$requestId'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'action': action}),
      );
      if (response.statusCode == 200 && jsonDecode(response.body)['success']) {
        await fetchFundRequests();
        return true;
      }
    } catch (e) {
      print('Error processing fund request: $e');
    }
    return false;
  }

  Future<void> fetchWithdrawals() async {
    _setLoading(true);
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/withdrawals'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        _withdrawals = jsonDecode(response.body)['data'] ?? [];
      }
    } catch (e) {
      print('Error fetching withdrawals: $e');
    }
    _setLoading(false);
  }

  Future<bool> processWithdrawal(String id, String action) async {
    try {
      final token = await _getToken();
      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/withdrawals/$id'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'action': action}),
      );
      if (response.statusCode == 200 && jsonDecode(response.body)['success']) {
        await fetchWithdrawals();
        return true;
      }
    } catch (e) {
      print('Error processing withdrawal: $e');
    }
    return false;
  }

  Future<void> fetchKycRequests() async {
    _setLoading(true);
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/kyc'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        _kycRequests = jsonDecode(response.body)['data'] ?? [];
      }
    } catch (e) {
      print('Error fetching kyc: $e');
    }
    _setLoading(false);
  }

  Future<bool> processKyc(String memberId, String action) async {
    try {
      final token = await _getToken();
      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/kyc/$memberId'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'action': action}),
      );
      if (response.statusCode == 200 && jsonDecode(response.body)['success']) {
        await fetchKycRequests();
        return true;
      }
    } catch (e) {
      print('Error processing kyc: $e');
    }
    return false;
  }

  List<dynamic> _products = [];
  List<dynamic> get products => _products;

  Map<String, dynamic>? _settings;
  Map<String, dynamic>? get settings => _settings;

  List<dynamic> _tickets = [];
  List<dynamic> get tickets => _tickets;

  Map<String, dynamic>? _fundStats;
  Map<String, dynamic>? get fundStats => _fundStats;

  Future<void> fetchProducts() async {
    _setLoading(true);
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/products'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        _products = jsonDecode(response.body)['data'] ?? [];
      }
    } catch (e) {
      print('Error fetching products: $e');
    }
    _setLoading(false);
  }

  Future<bool> addProduct(Map<String, dynamic> productData) async {
    try {
      final token = await _getToken();
      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/products'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode(productData),
      );
      if (response.statusCode == 200 && jsonDecode(response.body)['success']) {
        await fetchProducts();
        return true;
      }
    } catch (e) {
      print('Error adding product: $e');
    }
    return false;
  }

  Future<bool> deleteProduct(String id) async {
    try {
      final token = await _getToken();
      final response = await http.delete(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/products/$id'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200 && jsonDecode(response.body)['success']) {
        await fetchProducts();
        return true;
      }
    } catch (e) {
      print('Error deleting product: $e');
    }
    return false;
  }

  Future<void> fetchSettings() async {
    _setLoading(true);
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/settings'),
      );
      if (response.statusCode == 200) {
        _settings = jsonDecode(response.body)['data'];
      }
    } catch (e) {
      print('Error fetching settings: $e');
    }
    _setLoading(false);
  }

  Future<bool> updateSettings(Map<String, dynamic> newSettings) async {
    try {
      final token = await _getToken();
      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/settings'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode(newSettings),
      );
      if (response.statusCode == 200 && jsonDecode(response.body)['success']) {
        await fetchSettings();
        return true;
      }
    } catch (e) {
      print('Error updating settings: $e');
    }
    return false;
  }

  Future<void> fetchTickets() async {
    _setLoading(true);
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/tickets'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        _tickets = jsonDecode(response.body)['data'] ?? [];
      }
    } catch (e) {
      print('Error fetching tickets: $e');
    }
    _setLoading(false);
  }

  Future<bool> replyTicket(String ticketId, String reply) async {
    try {
      final token = await _getToken();
      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/tickets/$ticketId/reply'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({'reply': reply}),
      );
      if (response.statusCode == 200 && jsonDecode(response.body)['success']) {
        await fetchTickets();
        return true;
      }
    } catch (e) {
      print('Error replying to ticket: $e');
    }
    return false;
  }

  Future<void> fetchFundStats() async {
    _setLoading(true);
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/fund-stats'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        _fundStats = jsonDecode(response.body)['data'];
      }
    } catch (e) {
      print('Error fetching fund stats: $e');
    }
    _setLoading(false);
  }

  Future<Map<String, dynamic>> processFundAction({
    required String memberId,
    required double amount,
    required String actionType,
    required String walletType,
    String? remark,
  }) async {
    try {
      final token = await _getToken();
      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/fund-action'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: jsonEncode({
          'memberId': memberId,
          'amount': amount,
          'actionType': actionType,
          'walletType': walletType,
          'remark': remark,
        }),
      );
      final res = jsonDecode(response.body);
      if (response.statusCode == 200 && res['success'] == true) {
        await fetchFundStats();
        return {'success': true, 'message': res['message'] ?? 'Action successful'};
      } else {
        return {'success': false, 'message': res['message'] ?? 'Action failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error occurred'};
    }
  }

  Future<bool> triggerCron() async {
    try {
      final token = await _getToken();
      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/trigger-cron'),
        headers: {'Authorization': 'Bearer $token'},
      );
      return response.statusCode == 200 && jsonDecode(response.body)['success'] == true;
    } catch (e) {
      return false;
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }
}
