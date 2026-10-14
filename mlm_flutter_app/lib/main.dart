import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'providers/auth_provider.dart';
import 'providers/network_provider.dart';
import 'providers/dashboard_provider.dart';
import 'providers/profile_provider.dart';
import 'providers/admin_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/registration_success_screen.dart';
import 'screens/main_layout.dart';
import 'screens/deposit_screen.dart';
import 'screens/id_activation_screen.dart';
import 'screens/products_screen.dart';
import 'screens/admin_dashboard_screen.dart';
import 'screens/p2p_transfer_screen.dart';
import 'screens/withdraw_screen.dart';
import 'screens/passbook_screen.dart';
import 'screens/royalty_screen.dart';
import 'screens/cashback_screen.dart';
import 'screens/kyc_screen.dart';
import 'screens/change_password_screen.dart';
import 'screens/tpin_screen.dart';
import 'screens/admin_members_screen.dart';
import 'screens/admin_funds_screen.dart';
import 'screens/admin_payouts_screen.dart';
import 'screens/admin_kyc_screen.dart';
import 'screens/admin_products_screen.dart';
import 'screens/admin_settings_screen.dart';
import 'screens/admin_fund_management_screen.dart';
import 'screens/admin_support_screen.dart';
import 'screens/support_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/rebirth_screen.dart';
import 'screens/add_member_screen.dart';
import 'screens/team_network_screen.dart';
import 'screens/payment_settings_screen.dart';
import 'screens/admin_pools_screen.dart';
import 'screens/admin_reports_screen.dart';
import 'screens/admin_app_upload_screen.dart';
import 'screens/legal_policy_screen.dart';
import 'utils/constants.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => NetworkProvider()),
        ChangeNotifierProvider(create: (_) => DashboardProvider()),
        ChangeNotifierProvider(create: (_) => ProfileProvider()),
        ChangeNotifierProvider(create: (_) => AdminProvider()),
      ],
      child: const RoyalKuberaaApp(),
    ),
  );
}

class RoyalKuberaaApp extends StatelessWidget {
  const RoyalKuberaaApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = GoRouter(
      initialLocation: '/',
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const SplashScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: '/register_success',
          builder: (context, state) {
            final credentials = state.extra as Map<String, dynamic>? ?? {};
            return RegistrationSuccessScreen(credentials: credentials);
          },
        ),
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const MainLayout(initialIndex: 0),
        ),
        GoRoute(
          path: '/network',
          builder: (context, state) => const MainLayout(initialIndex: 1),
        ),
        GoRoute(
          path: '/finance',
          builder: (context, state) => const MainLayout(initialIndex: 2),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const MainLayout(initialIndex: 3),
        ),
        GoRoute(
          path: '/deposit',
          builder: (context, state) => const DepositScreen(),
        ),
        GoRoute(
          path: '/activate',
          builder: (context, state) => const IdActivationScreen(),
        ),
        GoRoute(
          path: '/activation',
          builder: (context, state) => const IdActivationScreen(),
        ),
        GoRoute(
          path: '/products',
          builder: (context, state) => const ProductsScreen(),
        ),
        GoRoute(
          path: '/admin',
          builder: (context, state) => const AdminDashboardScreen(),
        ),
        GoRoute(
          path: '/transfer',
          builder: (context, state) => const P2PTransferScreen(),
        ),
        GoRoute(
          path: '/p2p',
          builder: (context, state) => const P2PTransferScreen(),
        ),
        GoRoute(
          path: '/withdraw',
          builder: (context, state) => const WithdrawScreen(),
        ),
        GoRoute(
          path: '/passbook',
          builder: (context, state) => const PassbookScreen(),
        ),
        GoRoute(
          path: '/royalty',
          builder: (context, state) => const RoyaltyScreen(),
        ),
        GoRoute(
          path: '/cashback',
          builder: (context, state) => const CashbackScreen(),
        ),
        GoRoute(
          path: '/kyc',
          builder: (context, state) => const PaymentSettingsScreen(),
        ),
        GoRoute(
          path: '/change-password',
          builder: (context, state) => const ChangePasswordScreen(),
        ),
        GoRoute(
          path: '/tpin',
          builder: (context, state) => const TpinScreen(),
        ),
        GoRoute(
          path: '/admin/members',
          builder: (context, state) => const AdminMembersScreen(),
        ),
        GoRoute(
          path: '/admin/funds',
          builder: (context, state) => const AdminFundsScreen(),
        ),
        GoRoute(
          path: '/admin/payouts',
          builder: (context, state) => const AdminPayoutsScreen(),
        ),
        GoRoute(
          path: '/admin/kyc',
          builder: (context, state) => const AdminKycScreen(),
        ),
        GoRoute(
          path: '/admin/products',
          builder: (context, state) => const AdminProductsScreen(),
        ),
        GoRoute(
          path: '/admin/settings',
          builder: (context, state) => const AdminSettingsScreen(),
        ),
        GoRoute(
          path: '/admin/fund-management',
          builder: (context, state) => const AdminFundManagementScreen(),
        ),
        GoRoute(
          path: '/admin/support',
          builder: (context, state) => const AdminSupportScreen(),
        ),
        GoRoute(
          path: '/support',
          builder: (context, state) => const SupportScreen(),
        ),
        GoRoute(
          path: '/notifications',
          builder: (context, state) => const NotificationsScreen(),
        ),
        GoRoute(
          path: '/rebirth',
          builder: (context, state) => const RebirthScreen(),
        ),
        GoRoute(
          path: '/add-member',
          builder: (context, state) => const AddMemberScreen(),
        ),
        GoRoute(
          path: '/team-network',
          builder: (context, state) => const TeamNetworkScreen(),
        ),
        GoRoute(
          path: '/payment-settings',
          builder: (context, state) => const PaymentSettingsScreen(),
        ),
        GoRoute(
          path: '/admin/pools',
          builder: (context, state) => const AdminPoolsScreen(),
        ),
        GoRoute(
          path: '/admin/reports',
          builder: (context, state) => const AdminReportsScreen(),
        ),
        GoRoute(
          path: '/admin/app-upload',
          builder: (context, state) => const AdminAppUploadScreen(),
        ),
        GoRoute(
          path: '/legal',
          builder: (context, state) => const LegalPolicyScreen(),
        ),
        GoRoute(
          path: '/terms',
          builder: (context, state) => const LegalPolicyScreen(initialTabIndex: 0),
        ),
        GoRoute(
          path: '/privacy',
          builder: (context, state) => const LegalPolicyScreen(initialTabIndex: 1),
        ),
        GoRoute(
          path: '/refund',
          builder: (context, state) => const LegalPolicyScreen(initialTabIndex: 2),
        ),
        GoRoute(
          path: '/disclaimer',
          builder: (context, state) => const LegalPolicyScreen(initialTabIndex: 3),
        ),
      ],
    );

    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
        useMaterial3: true,
        fontFamily: GoogleFonts.inter().fontFamily,
      ),
      routerConfig: router,
    );
  }
}
