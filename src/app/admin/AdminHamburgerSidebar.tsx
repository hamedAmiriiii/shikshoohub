"use client";

import { useMemo, useState, useEffect, type ReactNode } from "react";
import {
  Badge,
  Box,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { useTableOrdersPending } from "./table-orders/TableOrdersPendingProvider";
import HomeIcon from "@mui/icons-material/Home";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AssessmentIcon from "@mui/icons-material/Assessment";
import InventoryIcon from "@mui/icons-material/Inventory";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PeopleIcon from "@mui/icons-material/People";
import UndoIcon from "@mui/icons-material/Undo";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SmsIcon from "@mui/icons-material/Sms";
import SettingsIcon from "@mui/icons-material/Settings";
import CategoryIcon from "@mui/icons-material/Category";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import FactoryIcon from "@mui/icons-material/Factory";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import HandshakeIcon from "@mui/icons-material/Handshake";
import ShareIcon from "@mui/icons-material/Share";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import BadgeIcon from "@mui/icons-material/Badge";
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import BalanceIcon from "@mui/icons-material/Balance";
import CalculateIcon from "@mui/icons-material/Calculate";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddBoxIcon from "@mui/icons-material/AddBox";
import ListAltIcon from "@mui/icons-material/ListAlt";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import KitchenIcon from "@mui/icons-material/Kitchen";
import DescriptionIcon from "@mui/icons-material/Description";
import GroupsIcon from "@mui/icons-material/Groups";
import {
  ADMIN_POS_SETTINGS_CHANGED_EVENT,
  readAdminPosSettings,
} from "@/app/lib/adminPosSettings";
import { useShopPermissionGate, type ShopPermissionKey } from "@/app/lib/shopPermissions";

export const ADMIN_SIDEBAR_WIDTH = 200;

type NavLeaf = {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  permission?: ShopPermissionKey | ShopPermissionKey[];
};

type NavGroup = {
  id: string;
  label: string;
  icon: ReactNode;
  children: NavLeaf[];
};

type NavLink = {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  permission?: ShopPermissionKey | ShopPermissionKey[];
};

function isPathActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/accounting") return pathname === "/admin/accounting";
  // لیست محصولات نباید صفحهٔ ثبت کالا را فعال کند
  if (href === "/admin/product") {
    return (
      pathname === "/admin/product" ||
      (pathname.startsWith("/admin/product/") &&
        !pathname.startsWith("/admin/product/create"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActive(pathname: string | null, children: NavLeaf[]): boolean {
  return children.some((child) => isPathActive(pathname, child.href));
}

type AdminHamburgerSidebarProps = {
  pathname: string | null;
  shopName?: string;
  isSuperAdmin?: boolean;
  onNavigate: (path: string) => void;
  accessBanner?: ReactNode;
};

export default function AdminHamburgerSidebar({
  pathname,
  shopName = "فروشگاه",
  isSuperAdmin = false,
  onNavigate,
  accessBanner,
}: AdminHamburgerSidebarProps) {
  const { count: pendingTableOrders } = useTableOrdersPending();
  const { can } = useShopPermissionGate();
  const [restaurantCafeEnabled, setRestaurantCafeEnabled] = useState(false);
  const [producedGoodsMenuEnabled, setProducedGoodsMenuEnabled] = useState(false);

  useEffect(() => {
    const sync = () => {
      const settings = readAdminPosSettings();
      setRestaurantCafeEnabled(settings.restaurantCafeEnabled);
      setProducedGoodsMenuEnabled(settings.producedGoodsMenuEnabled);
    };
    sync();
    window.addEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(ADMIN_POS_SETTINGS_CHANGED_EVENT, sync);
  }, []);
  const financialChildren: NavLeaf[] = useMemo(
    () => [
      { id: "reports", label: "گزارش فروش", href: "/admin/reports", icon: <AssessmentIcon />, permission: "reports" },
      { id: "inventory", label: "موجودی انبار", href: "/admin/inventory", icon: <InventoryIcon />, permission: "products" },
      { id: "expenses", label: "لیست هزینه‌ها", href: "/admin/expenses", icon: <AttachMoneyIcon />, permission: "expenses" },
      {
        id: "beneficiaries",
        label: "ذینفعان خرید",
        href: "/admin/beneficiaries",
        icon: <GroupsIcon />,
        permission: ["invoices", "expenses"],
      },
      {
        id: "manual-trades",
        label: "ثبت سند",
        href: "/admin/manual-trades",
        icon: <DescriptionIcon />,
        permission: "manual_trades",
      },
      {
        id: "expenses-stats",
        label: "گزارش هزینه‌ها",
        href: "/admin/expenses-statistics",
        icon: <ReceiptIcon />,
        permission: "expenses",
      },
      {
        id: "cheques",
        label: "چک",
        href: "/admin/cheques",
        icon: <ReceiptLongIcon />,
        permission: "cheques",
      },
      { id: "installments", label: "لیست اقساط", href: "/admin/installments", icon: <CreditCardIcon />, permission: "installments" },
      {
        id: "installment-credits",
        label: "اعتبار اقساطی",
        href: "/admin/installment-credits",
        icon: <CreditCardIcon />,
        permission: "installments",
      },
      {
        id: "purchase-debts",
        label: "بدهکاران (نسیه)",
        href: "/admin/purchase-debts",
        icon: <AccountBalanceWalletIcon />,
        permission: "debts",
      },
      {
        id: "returned",
        label: "برگشت خرید",
        href: "/admin/returned-products",
        icon: <UndoIcon />,
        permission: "returns",
      },
      {
        id: "shop-accounts",
        label: "حساب‌های فروشگاه",
        href: "/admin/shop-accounts",
        icon: <PaymentsIcon />,
        permission: "shop_accounts",
      },
      {
        id: "daily",
        label: "تطبیق روزانه",
        href: "/admin/daily-reconciliation",
        icon: <AccountBalanceIcon />,
        permission: "daily_reconciliations",
      },
      {
        id: "petty-cash",
        label: "تنخواه",
        href: "/admin/petty-cash",
        icon: <AccountBalanceWalletIcon />,
        permission: "shop_accounts",
      },
      { id: "profit", label: "سود و ضرر", href: "/admin/profit-loss", icon: <TrendingUpIcon />, permission: "reports" },
    ],
    [],
  );

  const accountingChildren: NavLeaf[] = useMemo(
    () => [
      {
        id: "accounting-home",
        label: "حسابداری",
        href: "/admin/accounting",
        icon: <CalculateIcon />,
        permission: "accounting",
      },
      {
        id: "accounting-accounts",
        label: "درخت حساب",
        href: "/admin/accounting/accounts",
        icon: <AccountTreeIcon />,
        permission: "accounting",
      },
      {
        id: "accounting-vouchers",
        label: "اسناد حسابداری",
        href: "/admin/accounting/vouchers",
        icon: <ReceiptLongIcon />,
        permission: "accounting",
      },
      {
        id: "accounting-trial",
        label: "تراز آزمایشی",
        href: "/admin/accounting/trial-balance",
        icon: <BalanceIcon />,
        permission: "accounting",
      },
      {
        id: "accounting-ledger",
        label: "دفتر حساب",
        href: "/admin/accounting/ledger",
        icon: <MenuBookIcon />,
        permission: "accounting",
      },
      {
        id: "accounting-pl",
        label: "سود و زیان دفتر",
        href: "/admin/accounting/profit-loss",
        icon: <TrendingUpIcon />,
        permission: "accounting",
      },
      {
        id: "accounting-bs",
        label: "ترازنامه",
        href: "/admin/accounting/balance-sheet",
        icon: <AccountBalanceIcon />,
        permission: "accounting",
      },
    ],
    [],
  );

  const payrollChildren: NavLeaf[] = useMemo(
    () => [
      { id: "payroll", label: "لیست حقوق", href: "/admin/payroll", icon: <BadgeIcon />, permission: "employees" },
      {
        id: "payroll-employees",
        label: "کارمندها",
        href: "/admin/payroll/employees",
        icon: <PeopleIcon />,
        permission: "employees",
      },
      {
        id: "payroll-settings",
        label: "تنظیمات حقوق",
        href: "/admin/payroll/settings",
        icon: <SettingsIcon />,
        permission: "employees",
      },
    ],
    [],
  );

  const productChildren: NavLeaf[] = useMemo(
    () => {
      const items: NavLeaf[] = [
      {
        id: "best-selling",
        label: "محصولات پرفروش",
        href: "/admin/best-selling",
        icon: <TrendingUpIcon />,
        permission: "products",
      },
      {
        id: "manufacturers",
        label: "تولیدکنندگان",
        href: "/admin/manufacturers",
        icon: <FactoryIcon />,
        permission: "manufacturers",
      },
      { id: "invoices", label: "فاکتورها", href: "/admin/invoices", icon: <ReceiptIcon />, permission: "invoices" },
      { id: "categories", label: "دسته‌بندی", href: "/admin/categories", icon: <CategoryIcon />, permission: "categories" },
      {
        id: "bulk-discount",
        label: "تخفیف دسته جمعی",
        href: "/admin/bulk-discount",
        icon: <LocalOfferIcon />,
        permission: "products",
      },
      {
        id: "import-products",
        label: "ایمپورت  اکسل",
        href: "/admin/product/import",
        icon: <FileUploadIcon />,
        permission: "products",
      },
      ];
      if (producedGoodsMenuEnabled) {
        items.push({
          id: "production",
          label: "کالاهای تولیدی",
          href: "/admin/production",
          icon: <KitchenIcon />,
          permission: ["produced_goods", "raw_materials"],
        });
      }
      return items;
    },
    [producedGoodsMenuEnabled],
  );

  const smsChildren: NavLeaf[] = useMemo(
    () => [
      { id: "referral", label: "پنل معرفی", href: "/admin/referral", icon: <ShareIcon />, permission: "referral" },
      {
        id: "sms-logs",
        label: "پیامک‌های فروشگاه",
        href: "/admin/shop-sms-logs",
        icon: <SmsIcon />,
        permission: "shop_sms",
      },
      {
        id: "broadcast",
        label: "ارسال پیامک",
        href: "/admin/broadcast-sms",
        icon: <SmsIcon />,
        permission: "shop_sms",
      },
      {
        id: "sms-packages",
        label: "خرید بسته پیامک",
        href: "/admin/sms-packages",
        icon: <ShoppingCartCheckoutIcon />,
        permission: "shop_sms",
      },
    ],
    [],
  );

  const adminChildren: NavLeaf[] = useMemo(
    () => [
      {
        id: "shop-quota",
        label: "مدیریت فروشگاه‌ها",
        href: "/admin/shop-sms-quota",
        icon: <StorefrontIcon />,
      },
      {
        id: "sms-orders",
        label: "درخواست‌های بسته پیامک",
        href: "/admin/sms-package-orders",
        icon: <ReceiptLongIcon />,
      },
      {
        id: "agency-requests",
        label: "نمایندگی‌ها",
        href: "/admin/agency-requests",
        icon: <HandshakeIcon />,
      },
    ],
    [],
  );

  const topLinks: NavLink[] = useMemo(
    () => [
      { id: "sale", label: "فروش", href: "/admin", icon: <HomeIcon />, permission: ["pos", "dashboard"] },
      {
        id: "create-product",
        label: "ثبت کالا",
        href: "/admin/product/create",
        icon: <AddBoxIcon />,
        permission: "products",
      },
      {
        id: "sales-list",
        label: "لیست فروش",
        href: "/admin/purchas",
        icon: <ListAltIcon />,
        permission: "pos",
      },
      {
        id: "products",
        label: "محصولات",
        href: "/admin/product",
        icon: <Inventory2Icon />,
        permission: "products",
      },
      { id: "customers", label: "خریداران", href: "/admin/customers", icon: <PeopleIcon />, permission: "customers" },
      {
        id: "orders",
        label: "سفارشات اینترنتی",
        href: "/admin/orders",
        icon: <ShoppingBagIcon />,
        permission: "online_orders",
      },
      {
        id: "table-orders",
        label: "سفارش حضوری",
        href: "/admin/table-orders",
        icon: <TableRestaurantIcon />,
        permission: "shop_tables",
      },
      {
        id: "shop-tables",
        label: "میزهای فروشگاه",
        href: "/admin/shop-tables",
        icon: <TableRestaurantIcon />,
        permission: "shop_tables",
      },
    ],
    [],
  );

  const groups: NavGroup[] = useMemo(() => {
    const filterLeaves = (children: NavLeaf[]) =>
      children.filter((child) => can(child.permission));
    const base: NavGroup[] = [
      {
        id: "financial",
        label: "مالی",
        icon: <AccountBalanceIcon />,
        children: filterLeaves(financialChildren),
      },
      {
        id: "accounting",
        label: "حسابداری",
        icon: <CalculateIcon />,
        children: filterLeaves(accountingChildren),
      },
      {
        id: "payroll",
        label: "حقوق دستمزد",
        icon: <PaymentsIcon />,
        children: filterLeaves(payrollChildren),
      },
      {
        id: "products",
        label: "مدیریت کالا",
        icon: <InventoryIcon />,
        children: filterLeaves(productChildren),
      },
      {
        id: "sms",
        label: "پیامک",
        icon: <SmsIcon />,
        children: smsChildren.filter((child) => can(child.permission)),
      },
    ].filter((group) => group.children.length > 0);
    if (isSuperAdmin) {
      base.push({
        id: "admin",
        label: "ادمین",
        icon: <AdminPanelSettingsIcon />,
        children: adminChildren,
      });
    }
    return base;
  }, [accountingChildren, adminChildren, can, financialChildren, isSuperAdmin, payrollChildren, productChildren, smsChildren]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const activeGroup = groups.find((group) => groupHasActive(pathname, group.children));
    if (activeGroup) setExpandedId(activeGroup.id);
  }, [groups, pathname]);

  const toggleGroup = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const itemSx = (active: boolean) => ({
    mx: 0.75,
    mb: 0.25,
    borderRadius: "8px",
    minHeight: 36,
    py: 0.5,
    px: 1,
    gap: 0.5,
    direction: "ltr",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    color: active ? "#fff" : "var(--admin-text)",
    bgcolor: active ? "var(--admin-accent)" : "transparent",
    "&:hover": {
      bgcolor: active ? "var(--admin-accent-hover)" : "var(--admin-menu-hover)",
    },
    "& .nav-label-cluster": {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 0.75,
      flex: "1 1 auto",
      minWidth: 0,
      marginLeft: "auto",
    },
    "& .MuiListItemIcon-root": {
      minWidth: 28,
      marginRight: 0,
      marginLeft: 0,
      color: active ? "#fff" : "var(--admin-accent)",
      "& .MuiSvgIcon-root": { fontSize: 18 },
    },
    "& .MuiListItemText-root": {
      flex: "0 1 auto",
      margin: 0,
      textAlign: "right",
    },
    "& .MuiListItemText-primary": {
      fontSize: "12px",
      fontWeight: active ? 700 : 500,
      textAlign: "right",
    },
    "& .nav-expand-icon": {
      fontSize: 18,
      color: "var(--admin-text-muted)",
      flexShrink: 0,
    },
  });

  const childItemSx = (active: boolean) => ({
    ...itemSx(active),
    mx: 1,
    minHeight: 32,
    py: 0.35,
    pr: 0.5,
    pl: 1.25,
    bgcolor: active ? "var(--admin-accent)" : "transparent",
    "& .MuiListItemIcon-root": {
      minWidth: 24,
      color: active ? "#fff" : "var(--admin-text-muted)",
      "& .MuiSvgIcon-root": { fontSize: 16 },
    },
    "& .MuiListItemText-primary": {
      fontSize: "11px",
      fontWeight: active ? 700 : 500,
      textAlign: "right",
    },
  });

  const renderLeaf = (leaf: NavLeaf | NavLink, active: boolean, nested = false) => (
    <ListItemButton
      key={leaf.id}
      onClick={() => onNavigate(leaf.href)}
      sx={nested ? childItemSx(active) : itemSx(active)}
    >
      <Box className="nav-label-cluster">
        <ListItemText primary={leaf.label} />
        <ListItemIcon>
          {leaf.href === "/admin/table-orders" && pendingTableOrders > 0 ? (
            <Badge
              badgeContent={pendingTableOrders}
              color="error"
              max={99}
              sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem", minWidth: 16, height: 16 } }}
            >
              {leaf.icon}
            </Badge>
          ) : (
            leaf.icon
          )}
        </ListItemIcon>
      </Box>
    </ListItemButton>
  );

  const renderGroup = (group: NavGroup) => {
    const open = expandedId === group.id;
    return (
      <Box
        key={group.id}
        sx={{
          mx: 0.75,
          mb: 0.25,
          borderRadius: "8px",
          overflow: "hidden",
          bgcolor: open ? "var(--admin-surface-nested)" : "transparent",
          outline: open ? "1px solid var(--admin-accent-border)" : "none",
        }}
      >
        <ListItemButton
          onClick={() => toggleGroup(group.id)}
          sx={{
            ...itemSx(false),
            mx: 0,
            mb: 0,
            borderRadius: open ? "8px 8px 0 0" : "8px",
            bgcolor: open ? "var(--admin-menu-hover)" : "transparent",
            "&:hover": {
              bgcolor: "var(--admin-menu-hover)",
            },
            "& .MuiListItemText-primary": {
              fontSize: "12px",
              fontWeight: open ? 700 : 500,
              textAlign: "right",
            },
            "& .nav-expand-icon": {
              fontSize: 18,
              color: open ? "var(--admin-accent)" : "var(--admin-text-muted)",
              flexShrink: 0,
            },
          }}
        >
          <ExpandMoreIcon
            className="nav-expand-icon"
            sx={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
          <Box className="nav-label-cluster">
            <ListItemText primary={group.label} />
            <ListItemIcon>{group.icon}</ListItemIcon>
          </Box>
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List dense disablePadding sx={{ pb: 0.5 }}>
            {group.children.map((child) =>
              renderLeaf(child, isPathActive(pathname, child.href), true),
            )}
          </List>
        </Collapse>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "var(--admin-surface)",
      }}
    >
        <Box
          sx={{
            px: 1.25,
            py: 1.25,
            display: "flex",
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 1,
            borderBottom: "1px solid var(--admin-border)",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              bgcolor: "var(--admin-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <StorefrontIcon sx={{ fontSize: 16, color: "#fff" }} />
          </Box>
          <Typography
            sx={{
              color: "var(--admin-text)",
              fontSize: "12px",
              fontWeight: 700,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              textAlign: "right",
            }}
          >
            {shopName}
          </Typography>
        </Box>

      {accessBanner ? <Box sx={{ px: 0.75, pt: 0.75, flexShrink: 0 }}>{accessBanner}</Box> : null}

      <List
        dense
        disablePadding
        sx={{
          flex: 1,
          overflowY: "auto",
          py: 0.75,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "var(--admin-border)",
            borderRadius: 4,
          },
        }}
      >
        {topLinks[0] && can(topLinks[0].permission)
          ? renderLeaf(topLinks[0], isPathActive(pathname, topLinks[0].href))
          : null}
        {topLinks.slice(1, 4).filter((link) => can(link.permission)).map((link) =>
          renderLeaf(link, isPathActive(pathname, link.href)),
        )}
        {groups.filter((g) => g.id === "financial" || g.id === "accounting").map(renderGroup)}
        {topLinks.slice(4).filter((link) =>
          can(link.permission) &&
          (restaurantCafeEnabled || (link.id !== "table-orders" && link.id !== "shop-tables")),
        ).map((link) =>
          renderLeaf(link, isPathActive(pathname, link.href)),
        )}
        {groups.filter((g) => g.id !== "financial" && g.id !== "accounting").map(renderGroup)}
      </List>

      {can(["settings", "backup"]) ? (
      <Box
        sx={{
          flexShrink: 0,
          borderTop: "1px solid var(--admin-border)",
          pt: 0.5,
          pb: 0.75,
          bgcolor: "var(--admin-surface)",
        }}
      >
        <List dense disablePadding>
          <ListItemButton
            onClick={() => onNavigate("/admin/settings")}
            sx={itemSx(isPathActive(pathname, "/admin/settings"))}
          >
            <Box className="nav-label-cluster">
              <ListItemText primary="تنظیمات" />
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
            </Box>
          </ListItemButton>
        </List>
      </Box>
      ) : null}
    </Box>
  );
}
