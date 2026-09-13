<?php
/**
 * بازگشت از درگاه سامان کیش (SEP)
 * این فایل را روی دامنه ثبت‌شده در پنل SEP قرار دهید:
 *   https://webinoo-plus.ir/sep-callback.php
 *
 * در پنل SEP همین آدرس را بدون پارامتر اضافه ثبت کنید.
 * IP خروجی سرور API (api.webinoo-plus.ir) هم باید در پنل ثبت باشد.
 */
header('Content-Type: text/html; charset=utf-8');

$api = getenv('SEP_API_CALLBACK') ?: 'https://api.webinoo-plus.ir/api/payments/sep/callback';

// SEP معمولاً با POST برمی‌گردد؛ فیلدها را به API فوروارد می‌کنیم.
$payload = array_merge($_GET ?: [], $_POST ?: []);

$qs = http_build_query($payload);
$target = $api.(strpos($api, '?') === false ? '?' : '&').$qs;

// اگر POST خالی نبود، با فرم خودکار POST می‌کنیم تا بدنه هم برود
if (! empty($_POST)) {
    $action = htmlspecialchars($api, ENT_QUOTES, 'UTF-8');
    echo '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/><title>بازگشت از سامان</title></head><body>';
    echo '<p style="font-family:Tahoma;text-align:center;margin-top:40px">در حال بازگشت از درگاه سامان...</p>';
    echo '<form id="f" method="post" action="'.$action.'">';
    foreach ($_POST as $key => $value) {
        if (is_array($value)) {
            continue;
        }
        $k = htmlspecialchars((string) $key, ENT_QUOTES, 'UTF-8');
        $v = htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
        echo '<input type="hidden" name="'.$k.'" value="'.$v.'"/>';
    }
    foreach ($_GET as $key => $value) {
        if (is_array($value) || isset($_POST[$key])) {
            continue;
        }
        $k = htmlspecialchars((string) $key, ENT_QUOTES, 'UTF-8');
        $v = htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
        echo '<input type="hidden" name="'.$k.'" value="'.$v.'"/>';
    }
    echo '</form><script>document.getElementById("f").submit();</script></body></html>';
    exit;
}

header('Location: '.$target, true, 302);
exit;
