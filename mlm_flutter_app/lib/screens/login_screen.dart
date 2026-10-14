import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';
import '../widgets/pin_input_boxes.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _idController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePin = true;
  bool _rememberMe = true;
  String _errorMessage = '';

  @override
  void dispose() {
    _idController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    final memberId = _idController.text.trim();
    final password = _passwordController.text.trim();

    setState(() => _errorMessage = '');

    if (memberId.isEmpty) {
      setState(() => _errorMessage = 'Please enter your User ID or Mobile Number');
      return;
    }

    if (password.length != 6) {
      setState(() => _errorMessage = 'Please enter full 6-digit password');
      return;
    }

    final success = await context.read<AuthProvider>().login(
      memberId,
      password,
    );

    if (success && mounted) {
      context.go('/dashboard');
    } else if (mounted) {
      setState(() {
        _errorMessage = 'Invalid credentials. Please check your ID and 6-digit PIN.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF070E1B),
      resizeToAvoidBottomInset: true,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF070E1B), Color(0xFF0F1E36), Color(0xFF0A1527)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: IntrinsicHeight(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // ── TOP HEADER: Logo & Branding ──
                          Column(
                            children: [
                              const SizedBox(height: 6),
                              Container(
                                width: 72,
                                height: 72,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(color: const Color(0xFFD4AF37), width: 2.5),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFFDC2626).withOpacity(0.35),
                                      blurRadius: 22,
                                      spreadRadius: 2,
                                      offset: const Offset(0, 5),
                                    ),
                                  ],
                                ),
                                child: ClipOval(
                                  child: Image.asset(
                                    'assets/images/logo.jpg',
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) {
                                      return Container(
                                        color: const Color(0xFF0F172A),
                                        child: const Center(
                                          child: Text(
                                            'RK',
                                            style: TextStyle(
                                              color: Color(0xFFD4AF37),
                                              fontWeight: FontWeight.w900,
                                              fontSize: 26,
                                            ),
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ),
                              const SizedBox(height: 10),
                              ShaderMask(
                                shaderCallback: (bounds) => const LinearGradient(
                                  colors: [Color(0xFFEF4444), Color(0xFFF59E0B)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ).createShader(bounds),
                                child: Text(
                                  'ROYAL KUBERAA',
                                  style: GoogleFonts.inter(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                'Smart MLM & Wealth Creation Platform',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: Colors.white.withOpacity(0.65),
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                              const SizedBox(height: 12),
                            ],
                          ),

                          // ── MAIN FORM CARD (Fits screen cleanly) ──
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 22),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.25),
                                  blurRadius: 30,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Sign In',
                                  style: GoogleFonts.inter(
                                    fontSize: 21,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  'Enter your credentials to access your account',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                                const SizedBox(height: 18),

                                // Field 1: User ID
                                Text(
                                  'User ID / Mobile Number',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF334155),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                TextField(
                                  controller: _idController,
                                  textCapitalization: TextCapitalization.characters,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF0F172A),
                                  ),
                                  decoration: InputDecoration(
                                    hintText: 'Enter your ID or Mobile',
                                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                                    filled: true,
                                    fillColor: const Color(0xFFF8FAFC),
                                    prefixIcon: const Icon(Icons.person_outline_rounded, color: Color(0xFF94A3B8), size: 19),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.8),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 14),

                                // Field 2: Password
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Password (6 Digits)',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: const Color(0xFF334155),
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () => setState(() => _obscurePin = !_obscurePin),
                                      child: Row(
                                        children: [
                                          Icon(
                                            _obscurePin ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                            size: 14,
                                            color: const Color(0xFF64748B),
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            _obscurePin ? 'Show' : 'Hide',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              color: Color(0xFF64748B),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),

                                // Responsive PIN boxes
                                PinInputBoxes(
                                  length: 6,
                                  controller: _passwordController,
                                  obscureText: _obscurePin,
                                  onCompleted: (_) => _handleLogin(),
                                ),
                                const SizedBox(height: 12),

                                // Remember Me & Forgot Password
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    GestureDetector(
                                      onTap: () => setState(() => _rememberMe = !_rememberMe),
                                      child: Row(
                                        children: [
                                          SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: Checkbox(
                                              value: _rememberMe,
                                              activeColor: const Color(0xFFDC2626),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                              onChanged: (v) => setState(() => _rememberMe = v ?? true),
                                            ),
                                          ),
                                          const SizedBox(width: 7),
                                          const Text(
                                            'Remember me',
                                            style: TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                                          ),
                                        ],
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(
                                            content: Text('Please contact support or admin to reset your password.'),
                                          ),
                                        );
                                      },
                                      child: const Text(
                                        'Forgot password?',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFFDC2626),
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),

                                // Error message banner
                                if (_errorMessage.isNotEmpty) ...[
                                  const SizedBox(height: 10),
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFEE2E2),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(color: const Color(0xFFFCA5A5)),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 16),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            _errorMessage,
                                            style: const TextStyle(
                                              color: Color(0xFFB91C1C),
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],

                                const SizedBox(height: 18),

                                // Login Button
                                SizedBox(
                                  width: double.infinity,
                                  height: 48,
                                  child: DecoratedBox(
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(
                                        colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                      borderRadius: BorderRadius.circular(12),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFFDC2626).withOpacity(0.35),
                                          blurRadius: 16,
                                          offset: const Offset(0, 6),
                                        ),
                                      ],
                                    ),
                                    child: ElevatedButton(
                                      onPressed: auth.isLoading ? null : _handleLogin,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.transparent,
                                        shadowColor: Colors.transparent,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                      child: auth.isLoading
                                          ? const SizedBox(
                                              width: 20,
                                              height: 20,
                                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                            )
                                          : Row(
                                              mainAxisAlignment: MainAxisAlignment.center,
                                              children: [
                                                Text(
                                                  'Login',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 15,
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.white,
                                                    letterSpacing: 0.6,
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                                              ],
                                            ),
                                    ),
                                  ),
                                ),

                                const SizedBox(height: 14),

                                // Register link
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Text(
                                      "Don't have an account? ",
                                      style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                    ),
                                    GestureDetector(
                                      onTap: () => context.push('/register'),
                                      child: Text(
                                        'Register Now',
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          color: const Color(0xFFDC2626),
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),

                          // ── BOTTOM FOOTER: Security Badge ──
                          Padding(
                            padding: const EdgeInsets.only(top: 10, bottom: 4),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.lock_outline_rounded, size: 12, color: Colors.white.withOpacity(0.4)),
                                const SizedBox(width: 5),
                                Text(
                                  '256-Bit SSL Encrypted & Secure System',
                                  style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.4)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
