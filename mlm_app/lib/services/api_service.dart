import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Update this to your VPS IP later (e.g., 'http://123.45.67.89:5000')
  static const String baseUrl = 'http://localhost:5000/api';

  // Fetch Dashboard Data
  static Future<Map<String, dynamic>?> getDashboardData(int userId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/dashboard/$userId'));
      
      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);
        if (responseData['status'] == 'success') {
          return responseData['data'];
        }
      }
      return null;
    } catch (e) {
      print('Error fetching dashboard data: $e');
      return null;
    }
  }

  // Placeholder for Login
  static Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password}),
      );
      return json.decode(response.body);
    } catch (e) {
      print('Error during login: $e');
      return null;
    }
  }
}
