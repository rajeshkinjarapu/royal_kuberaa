import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:go_router/go_router.dart';
import '../utils/constants.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  List<dynamic> _products = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/products'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] != null && (data['data'] as List).isNotEmpty) {
          setState(() => _products = data['data']);
        } else {
          _useFallbackProducts();
        }
      } else {
        _useFallbackProducts();
      }
    } catch (e) {
      _useFallbackProducts();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _useFallbackProducts() {
    setState(() {
      _products = [
        {
          '_id': 'kit_1',
          'name': 'Nord Buds 3 Wireless Earbuds Kit',
          'price': 1500,
          'description': 'Premium ANC Earbuds with up to 32dB Active Noise Cancellation and 11-Hour Fast Charging with Welcome Kit.',
          'deliveryType': 'Free Home Delivery',
          'icon': '🎧',
        },
        {
          '_id': 'kit_2',
          'name': 'Royal Smartwatch & Fitness Kit',
          'price': 1500,
          'description': '1.96" AMOLED Display Bluetooth Calling Smartwatch with Heart Rate, SpO2 & 100+ Sports Modes.',
          'deliveryType': 'Free Home Delivery',
          'icon': '⌚',
        },
        {
          '_id': 'kit_3',
          'name': 'Royal Wellness & Ayurvedic Kit',
          'price': 1500,
          'description': 'Immunity booster herbal extract combo kit crafted for everyday health and vitality.',
          'deliveryType': 'Free Home Delivery',
          'icon': '🌿',
        },
      ];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Product Welcome Kits'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchProducts,
              child: ListView(
                padding: const EdgeInsets.all(16.0),
                children: [
                  Text(
                    'Select your preferred tangible welcome kit (Included with ₹1500 Joining)',
                    style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 16),
                  ..._products.map((p) => _buildProductCard(p)),
                ],
              ),
            ),
    );
  }

  Widget _buildProductCard(dynamic p) {
    final name = p['name'] ?? 'Product Kit';
    final price = p['price'] ?? 1500;
    final desc = p['description'] ?? 'Tangible Welcome Kit delivered directly to your doorstep.';
    final delivery = p['deliveryType'] ?? 'Free Home Delivery';
    final icon = p['icon'] ?? '📦';

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            height: 140,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary.withOpacity(0.08), AppColors.secondary.withOpacity(0.08)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Center(
              child: Text(icon, style: const TextStyle(fontSize: 64)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                    ),
                    Text(
                      '₹$price',
                      style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.primary),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  desc,
                  style: const TextStyle(color: AppColors.textSecondary, height: 1.4, fontSize: 13),
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.local_shipping_outlined, size: 16, color: AppColors.secondary),
                      const SizedBox(width: 6),
                      Text(delivery, style: const TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: () {
                      context.push('/activate');
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Activate ID With This Kit', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
