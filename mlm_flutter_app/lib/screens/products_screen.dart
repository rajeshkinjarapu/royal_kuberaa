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

class _ProductsScreenState extends State<ProductsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<dynamic> _products = [];
  List<dynamic> _myOrders = [];
  bool _isLoading = true;
  bool _isLoadingOrders = false;
  double _userWalletBalance = 0.0;
  String _userName = '';
  String _userMobile = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 1 && !_tabController.indexIsChanging) {
        _fetchMyOrders();
      }
    });
    _fetchProducts();
    _fetchUserProfile();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchUserProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) return;

      final res = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/user/profile'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final u = data['user'] ?? data['data'];
        if (data['success'] == true && u != null) {
          if (mounted) {
            setState(() {
              _userWalletBalance = ((u['mainWallet'] ?? 0) as num).toDouble();
              _userName = (u['name'] ?? '').toString();
              _userMobile = (u['mobile'] ?? '').toString();
            });
          }
        }
      }
    } catch (_) {}
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

  Future<void> _fetchMyOrders() async {
    setState(() => _isLoadingOrders = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/orders/my-orders'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] != null) {
          setState(() => _myOrders = data['data']);
        }
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoadingOrders = false);
    }
  }

  void _useFallbackProducts() {
    setState(() {
      _products = [
        {
          '_id': 'kit_1',
          'name': 'Nord Buds 3 Wireless Earbuds Kit',
          'price': 1500,
          'description': 'Nord Buds 3 Truly Wireless Bluetooth Earbuds with up to 32dB Active Noise Cancellation, 10mins for 11Hours Fast Charging with Up to 43h Music Playback - Chromatic Blue.',
          'deliveryInfo': 'Doorstep Courier Delivery',
          'image': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
          'badge': 'BEST SELLER',
        },
        {
          '_id': 'kit_2',
          'name': 'Royal Smartwatch & Fitness Kit',
          'price': 1500,
          'description': '1.96" AMOLED HD Curved Display Bluetooth Calling Smartwatch with Zinc Alloy Frame, Heart Rate, SpO2 & 100+ Sports Fitness Tracking Modes.',
          'deliveryInfo': 'Doorstep Courier Delivery',
          'image': 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80',
          'badge': 'TRENDING',
        },
        {
          '_id': 'kit_3',
          'name': 'Royal Wellness & Ayurvedic Combo Kit',
          'price': 1500,
          'description': 'Immunity booster herbal organic extracts kit with Shilajit, Ashwagandha & Multivitamins crafted for everyday energy, strength, and vitality.',
          'deliveryInfo': 'Doorstep Courier Delivery',
          'image': 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&auto=format&fit=crop&q=80',
          'badge': 'HERBAL CARE',
        },
      ];
    });
  }

  String _formatImageUrl(String? rawUrl) {
    if (rawUrl == null || rawUrl.isEmpty) return '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    final serverBase = AppConstants.apiBaseUrl.replaceAll('/api', '');
    if (rawUrl.startsWith('/')) return '$serverBase$rawUrl';
    return '$serverBase/$rawUrl';
  }

  void _showOrderBottomSheet(dynamic product) {
    final name = product['name'] ?? 'Product Kit';
    final double productPrice = ((product['price'] ?? 1500) as num).toDouble();
    final imageUrl = _formatImageUrl(product['image']?.toString());

    final nameController = TextEditingController(text: _userName);
    final phoneController = TextEditingController(text: _userMobile);
    final pincodeController = TextEditingController();
    final stateController = TextEditingController(text: 'Andhra Pradesh');
    final cityController = TextEditingController();
    final addressController = TextEditingController();
    final landmarkController = TextEditingController();

    double deliveryFee = 50.0;
    String deliveryZone = 'Local Zone (Andhra Pradesh & Telangana)';
    int approxDistance = 250;
    String estimatedDays = '2 - 3 Business Days';
    bool isCalculatingDelivery = false;
    bool isSubmittingOrder = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (bottomSheetContext) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final double totalPayable = productPrice + deliveryFee;
            final bool hasEnoughBalance = _userWalletBalance >= totalPayable;

            Future<void> calcDelivery(String pin) async {
              if (pin.trim().length != 6) return;
              setModalState(() => isCalculatingDelivery = true);
              try {
                final prefs = await SharedPreferences.getInstance();
                final token = prefs.getString('token');
                final res = await http.post(
                  Uri.parse('${AppConstants.apiBaseUrl}/products/calculate-delivery'),
                  headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
                  body: jsonEncode({'pincode': pin.trim(), 'state': stateController.text.trim()}),
                );
                if (res.statusCode == 200) {
                  final data = jsonDecode(res.body);
                  if (data['success'] == true && data['data'] != null) {
                    final d = data['data'];
                    setModalState(() {
                      deliveryFee = ((d['deliveryCharge'] ?? 50) as num).toDouble();
                      deliveryZone = d['zone'] ?? deliveryZone;
                      approxDistance = ((d['approxDistanceKm'] ?? 250) as num).toInt();
                      estimatedDays = d['estimatedDays'] ?? estimatedDays;
                    });
                  }
                }
              } catch (_) {
              } finally {
                setModalState(() => isCalculatingDelivery = false);
              }
            }

            Future<void> submitOrder() async {
              if (nameController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter recipient full name')));
                return;
              }
              if (phoneController.text.trim().length < 10) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid 10-digit mobile number')));
                return;
              }
              if (pincodeController.text.trim().length != 6) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid 6-digit delivery pincode')));
                return;
              }
              if (cityController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter your city/town')));
                return;
              }
              if (addressController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter your full house/flat & street address')));
                return;
              }

              if (!hasEnoughBalance) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Insufficient Main Wallet balance (Required: ₹${totalPayable.toStringAsFixed(0)}, Available: ₹${_userWalletBalance.toStringAsFixed(0)}). Please deposit funds.'),
                    backgroundColor: AppColors.error,
                  ),
                );
                return;
              }

              // Confirm dialog before deducting amount
              final confirm = await showDialog<bool>(
                context: context,
                builder: (dialogCtx) => AlertDialog(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  title: Row(
                    children: [
                      const Icon(Icons.account_balance_wallet, color: AppColors.primary, size: 22),
                      const SizedBox(width: 8),
                      Text('Confirm Order & Pay', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Are you sure you want to deduct ₹${totalPayable.toStringAsFixed(0)} from your Main Wallet to order "$name"?', style: const TextStyle(fontSize: 13, height: 1.4)),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Product Price:', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                Text('₹${productPrice.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Delivery Fee (~$approxDistance km):', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                Text('₹${deliveryFee.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const Divider(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total Wallet Deduction:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                                Text('₹${totalPayable.toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF059669))),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(dialogCtx, false), child: const Text('Cancel')),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(dialogCtx, true),
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669)),
                      child: const Text('Confirm & Pay', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              );

              if (confirm != true) return;

              setModalState(() => isSubmittingOrder = true);
              try {
                final prefs = await SharedPreferences.getInstance();
                final token = prefs.getString('token');

                final res = await http.post(
                  Uri.parse('${AppConstants.apiBaseUrl}/orders/create'),
                  headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
                  body: jsonEncode({
                    'productId': product['_id'],
                    'shippingAddress': {
                      'fullName': nameController.text.trim(),
                      'phone': phoneController.text.trim(),
                      'pincode': pincodeController.text.trim(),
                      'state': stateController.text.trim(),
                      'city': cityController.text.trim(),
                      'addressLine': addressController.text.trim(),
                      'landmark': landmarkController.text.trim(),
                    }
                  }),
                );

                final data = jsonDecode(res.body);
                if (res.statusCode == 200 && data['success'] == true) {
                  if (bottomSheetContext.mounted) {
                    Navigator.pop(bottomSheetContext);
                  }
                  await _fetchUserProfile();
                  _tabController.animateTo(1);
                  _fetchMyOrders();

                  if (mounted) {
                    showDialog(
                      context: context,
                      builder: (c) => AlertDialog(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        title: const Row(
                          children: [
                            Icon(Icons.check_circle, color: Color(0xFF059669), size: 26),
                            SizedBox(width: 8),
                            Text('Order Placed!'),
                          ],
                        ),
                        content: Text(
                          'Your order has been confirmed successfully!\nOrder ID: ${data['order']?['orderId'] ?? ''}\n₹${totalPayable.toStringAsFixed(0)} was deducted from your Main Wallet. Track dispatch under "My Orders".',
                          style: const TextStyle(fontSize: 13, height: 1.4),
                        ),
                        actions: [
                          ElevatedButton(
                            onPressed: () => Navigator.pop(c),
                            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                            child: const Text('OK', style: TextStyle(color: Colors.white)),
                          )
                        ],
                      ),
                    );
                  }
                } else {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(data['message'] ?? 'Failed to place order'),
                        backgroundColor: AppColors.error,
                      ),
                    );
                  }
                }
              } catch (err) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error placing order: $err'), backgroundColor: AppColors.error),
                  );
                }
              } finally {
                setModalState(() => isSubmittingOrder = false);
              }
            }

            return Container(
              height: MediaQuery.of(context).size.height * 0.88,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  // Handle Bar & Header
                  Container(
                    margin: const EdgeInsets.only(top: 10, bottom: 6),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Delivery & Order Details', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                            const Text('Enter shipping address to calculate courier fee', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Color(0xFF64748B)),
                          onPressed: () => Navigator.pop(bottomSheetContext),
                        )
                      ],
                    ),
                  ),
                  const Divider(height: 1),

                  // Form Content
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        // Product Summary Snippet
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  width: 60,
                                  height: 60,
                                  color: const Color(0xFFE2E8F0),
                                  child: imageUrl.isNotEmpty
                                      ? Image.network(
                                          imageUrl,
                                          fit: BoxFit.cover,
                                          errorBuilder: (ctx, error, stackTrace) => const Icon(Icons.inventory_2, color: Color(0xFF94A3B8)),
                                        )
                                      : const Icon(Icons.inventory_2, color: Color(0xFF94A3B8)),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    const SizedBox(height: 2),
                                    Text('Kit Price: ₹${productPrice.toStringAsFixed(0)}', style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 13)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 18),
                        Text('SHIPPING ADDRESS', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF64748B), letterSpacing: 0.5)),
                        const SizedBox(height: 12),

                        // Full Name
                        TextField(
                          controller: nameController,
                          decoration: InputDecoration(
                            labelText: 'Full Name *',
                            prefixIcon: const Icon(Icons.person, size: 20),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Mobile Number
                        TextField(
                          controller: phoneController,
                          keyboardType: TextInputType.phone,
                          decoration: InputDecoration(
                            labelText: 'Phone Number (10 Digits) *',
                            prefixIcon: const Icon(Icons.phone, size: 20),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Pincode & State
                        Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: TextField(
                                controller: pincodeController,
                                keyboardType: TextInputType.number,
                                maxLength: 6,
                                onChanged: (val) {
                                  if (val.length == 6) calcDelivery(val);
                                },
                                decoration: InputDecoration(
                                  labelText: 'Pincode *',
                                  counterText: '',
                                  prefixIcon: const Icon(Icons.location_on, size: 20),
                                  suffixIcon: isCalculatingDelivery
                                      ? const Padding(
                                          padding: EdgeInsets.all(12),
                                          child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                                        )
                                      : null,
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              flex: 4,
                              child: TextField(
                                controller: stateController,
                                decoration: InputDecoration(
                                  labelText: 'State *',
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // City
                        TextField(
                          controller: cityController,
                          decoration: InputDecoration(
                            labelText: 'City / District *',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // House / Flat / Street Address
                        TextField(
                          controller: addressController,
                          maxLines: 2,
                          decoration: InputDecoration(
                            labelText: 'Flat, House No, Building, Street *',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.all(12),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Landmark
                        TextField(
                          controller: landmarkController,
                          decoration: InputDecoration(
                            labelText: 'Landmark (Optional)',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          ),
                        ),

                        const SizedBox(height: 18),

                        // Dynamic Distance & Delivery Card
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.local_shipping, size: 18, color: Color(0xFF2563EB)),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      deliveryZone,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E40AF)),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF2563EB),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text('₹${deliveryFee.toStringAsFixed(0)} Delivery', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '• Estimated Distance: ~$approxDistance km\n• Delivery Time: $estimatedDays via Courier partner',
                                style: const TextStyle(fontSize: 11.5, color: Color(0xFF3B82F6), height: 1.4),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Order Bill & Wallet Balance Summary
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('BILL BREAKDOWN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 0.5)),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Product Kit Price:', style: TextStyle(fontSize: 13, color: Color(0xFF475569))),
                                  Text('₹${productPrice.toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Delivery Charge (~$approxDistance km):', style: const TextStyle(fontSize: 13, color: Color(0xFF475569))),
                                  Text('₹${deliveryFee.toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF059669))),
                                ],
                              ),
                              const Divider(height: 20),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Total Wallet Deduction:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                                  Text('₹${totalPayable.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A))),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Your Main Wallet Balance:', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                  Text(
                                    '₹${_userWalletBalance.toStringAsFixed(0)}',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: hasEnoughBalance ? const Color(0xFF059669) : const Color(0xFFDC2626),
                                    ),
                                  ),
                                ],
                              ),
                              if (!hasEnoughBalance) ...[
                                const SizedBox(height: 10),
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFEF2F2),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFFECACA)),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.info_outline, size: 16, color: Color(0xFFDC2626)),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          'Insufficient wallet balance. You need ₹${(totalPayable - _userWalletBalance).toStringAsFixed(0)} more.',
                                          style: const TextStyle(fontSize: 11, color: Color(0xFFDC2626), fontWeight: FontWeight.w500),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // Action Buttons
                        if (hasEnoughBalance)
                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton.icon(
                              onPressed: isSubmittingOrder ? null : submitOrder,
                              icon: isSubmittingOrder
                                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : const Icon(Icons.check_circle, color: Colors.white, size: 20),
                              label: Text(
                                isSubmittingOrder ? 'Placing Order...' : 'Confirm & Deduct ₹${totalPayable.toStringAsFixed(0)}',
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF059669),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          )
                        else
                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton.icon(
                              onPressed: () {
                                Navigator.pop(bottomSheetContext);
                                context.push('/deposit');
                              },
                              icon: const Icon(Icons.add, color: Colors.white, size: 20),
                              label: const Text('Deposit Funds to Main Wallet', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Product Welcome Kits'),
        backgroundColor: AppColors.darkNavy,
        foregroundColor: Colors.white,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF10B981),
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: const Color(0xFF94A3B8),
          tabs: const [
            Tab(text: 'Browse Kits', icon: Icon(Icons.inventory_2, size: 18)),
            Tab(text: 'My Orders', icon: Icon(Icons.local_shipping, size: 18)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // TAB 1: BROWSE KITS
          _isLoading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: () async {
                    await _fetchProducts();
                    await _fetchUserProfile();
                  },
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 40.0),
                    children: [
                      // Subtitle & Wallet Balance Card
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.account_balance_wallet, size: 18, color: Color(0xFF059669)),
                                SizedBox(width: 8),
                                Text('Main Wallet:', style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B))),
                              ],
                            ),
                            Text(
                              '₹${_userWalletBalance.toStringAsFixed(0)}',
                              style: GoogleFonts.inter(fontSize: 14.5, fontWeight: FontWeight.w900, color: const Color(0xFF059669)),
                            ),
                          ],
                        ),
                      ),
                      ..._products.map((p) => _buildProductCard(p)),
                    ],
                  ),
                ),

          // TAB 2: MY ORDERS
          _isLoadingOrders
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _fetchMyOrders,
                  child: _myOrders.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.shopping_bag_outlined, size: 64, color: Color(0xFF94A3B8)),
                              const SizedBox(height: 12),
                              const Text('No orders placed yet', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF475569))),
                              const SizedBox(height: 6),
                              const Text('Your product kit orders and tracking will show here.', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: () => _tabController.animateTo(0),
                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                                child: const Text('Browse Products', style: TextStyle(color: Colors.white)),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 40.0),
                          itemCount: _myOrders.length,
                          itemBuilder: (ctx, index) => _buildOrderCard(_myOrders[index]),
                        ),
                ),
        ],
      ),
    );
  }

  Widget _buildProductCard(dynamic p) {
    final name = p['name'] ?? 'Product Kit';
    final price = p['price'] ?? 1500;
    final desc = p['description'] ?? 'Tangible Welcome Kit delivered directly to your doorstep.';
    final delivery = p['deliveryInfo'] ?? 'Doorstep Courier Delivery';
    final badge = p['badge'] ?? '';
    final imageUrl = _formatImageUrl(p['image']?.toString());

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
          // Product Image Banner
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                child: Container(
                  width: double.infinity,
                  height: 190,
                  color: const Color(0xFFF1F5F9),
                  child: imageUrl.isNotEmpty
                      ? Image.network(
                          imageUrl,
                          fit: BoxFit.cover,
                          loadingBuilder: (ctx, child, progress) {
                            if (progress == null) return child;
                            return const Center(child: CircularProgressIndicator(strokeWidth: 2));
                          },
                          errorBuilder: (ctx, error, stackTrace) {
                            return Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.inventory_2, size: 48, color: Color(0xFF94A3B8)),
                                  const SizedBox(height: 6),
                                  Text(name, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                ],
                              ),
                            );
                          },
                        )
                      : const Center(
                          child: Icon(Icons.inventory_2, size: 56, color: Color(0xFF94A3B8)),
                        ),
                ),
              ),
              if (badge.toString().isNotEmpty)
                Positioned(
                  top: 14,
                  right: 14,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 6),
                      ],
                    ),
                    child: Text(
                      badge.toString().toUpperCase(),
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                    ),
                  ),
                ),
            ],
          ),

          Padding(
            padding: const EdgeInsets.all(18.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      '₹$price',
                      style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: const Color(0xFF059669)),
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
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.local_shipping, size: 15, color: Color(0xFF2563EB)),
                      const SizedBox(width: 6),
                      Text(delivery, style: const TextStyle(color: Color(0xFF1E40AF), fontWeight: FontWeight.bold, fontSize: 11.5)),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // "Order This Product" Button
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton.icon(
                    onPressed: () => _showOrderBottomSheet(p),
                    icon: const Icon(Icons.shopping_bag_outlined, size: 18, color: Colors.white),
                    label: const Text('Order This Product', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(dynamic order) {
    final orderId = order['orderId'] ?? '---';
    final productName = order['productName'] ?? 'Product Kit';
    final productPrice = order['productPrice'] ?? 1500;
    final deliveryCharge = order['deliveryCharge'] ?? 50;
    final totalAmount = order['totalAmount'] ?? (productPrice + deliveryCharge);
    final status = order['orderStatus'] ?? 'Pending';
    final courier = order['courierPartner'] ?? '';
    final tracking = order['trackingNumber'] ?? '';
    final addr = order['shippingAddress'] as Map<String, dynamic>? ?? {};
    final dateStr = (order['createdAt'] ?? '').toString();

    Color statusColor;
    if (status == 'Delivered') {
      statusColor = const Color(0xFF059669);
    } else if (status == 'Shipped') {
      statusColor = const Color(0xFF2563EB);
    } else {
      statusColor = const Color(0xFFD97706);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(orderId, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: const Color(0xFF0F172A))),
                  if (dateStr.isNotEmpty)
                    Text(
                      dateStr.length >= 10 ? dateStr.substring(0, 10) : dateStr,
                      style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                    ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: statusColor.withOpacity(0.3)),
                ),
                child: Text(
                  status.toString().toUpperCase(),
                  style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(productName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B))),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Paid: ₹$totalAmount (Item: ₹$productPrice + Delivery: ₹$deliveryCharge)', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            ],
          ),
          const Divider(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.location_on, size: 16, color: Color(0xFF64748B)),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '${addr['fullName'] ?? ''}, ${addr['addressLine'] ?? ''}, ${addr['city'] ?? ''}, ${addr['state'] ?? ''} - ${addr['pincode'] ?? ''}',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                ),
              ),
            ],
          ),
          if (courier.toString().isNotEmpty || tracking.toString().isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
              child: Row(
                children: [
                  const Icon(Icons.local_shipping, size: 16, color: Color(0xFF2563EB)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Courier: ${courier.toString().isNotEmpty ? courier : 'Standard'} • Tracking: ${tracking.toString().isNotEmpty ? tracking : 'In Transit'}',
                      style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF1E40AF)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
