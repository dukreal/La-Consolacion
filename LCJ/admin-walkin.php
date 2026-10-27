<?php
session_start();
require_once 'db.php';
require_once 'admin-check.php';

// IMPORTANT: Set this to the ID of your 'Walk-in Customer' user from the database
$guest_user_id = 2; 

$message = "";
$error = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['complete_sale'])) {
    $product_id = intval($_POST['product_id']);
    $quantity = intval($_POST['quantity']);
    $pay_method = $_POST['payment_method']; 
    $ref_no = !empty($_POST['reference_number']) ? $_POST['reference_number'] : 'CASH-' . time();

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT name, price, stock FROM products WHERE id = ? AND deleted = 0 FOR UPDATE");
        $stmt->execute([$product_id]);
        $product = $stmt->fetch();

        if (!$product || $product['stock'] < $quantity) {
            throw new Exception("Insufficient stock available!");
        }

        $total_price = $product['price'] * $quantity;
        
        // Define payment details based on method
        $payment_map = [
            'CASH'    => ['service' => 'Cash',    'image' => 'cash_default.png'],
            'GCASH'   => ['service' => 'GCash',   'image' => 'gcash-logo.png'],
            'PAYMAYA' => ['service' => 'PayMaya', 'image' => 'maya-logo.png'],
            'GOTYME'  => ['service' => 'GoTyme',  'image' => 'gotyme-logo.png']
        ];

        $payment_service = $payment_map[$pay_method]['service'] ?? 'Cash';
        $payment_image = $payment_map[$pay_method]['image'] ?? 'cash_default.png';

        // 1. Insert Payment
        $stmt = $pdo->prepare("INSERT INTO payments (reference_number, service, image, mobile, amount) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$ref_no, $payment_service, $payment_image, 'Walk-in', $total_price]);
        $payment_id = $pdo->lastInsertId();

        // 2. Insert Order
        $stmt = $pdo->prepare("INSERT INTO orders (user_id, payment_id, status, date_completed) VALUES (?, ?, 'completed', NOW())");
        $stmt->execute([$guest_user_id, $payment_id]);
        $order_id = $pdo->lastInsertId();

        // 3. Insert Order Item
        $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)");
        $stmt->execute([$order_id, $product_id, $quantity, $product['price']]);

        // 4. Deduct Stock
        $stmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
        $stmt->execute([$quantity, $product_id]);

        $pdo->commit();
        header("Location: admin-orders.php?success=walkin");
        exit();

    } catch (Exception $e) {
        $pdo->rollBack();
        $error = $e->getMessage();
    }
}

// Fetch Products (Excluding custom items)
$products = $pdo->query("SELECT id, name, price, stock FROM products WHERE deleted = 0 AND stock > 0 AND type != 'custom' ORDER BY name ASC")->fetchAll();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Walk-In POS - La Consolacion Jewelry</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
      body { background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #e8eaf6 100%); }
      .glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
      .gradient-deep-blue { background: linear-gradient(135deg, #1f488a 0%, #123366 100%); }
      .input-focus:focus { border-color: #3b82f6; ring: 2px; ring-color: #bfdbfe; }
    </style>
</head>
<body class="min-h-screen">
    <?php include 'layout-header.php'; ?>
    
    <main class="flex-1 p-8 ml-72 h-[calc(100vh-80px)] overflow-y-auto">
        <!-- Header -->
        <div class="mb-8 flex items-center justify-between">
            <div>
                <h1 class="text-4xl font-extrabold text-gray-800 tracking-tight">Walk-In Order</h1>
                <p class="text-gray-600 text-lg">Point of Sale System for physical store purchases</p>
            </div>
            <a href="admin-orders.php" class="p-3 bg-white/50 hover:bg-white rounded-full transition shadow-sm border border-gray-200">
                <i data-lucide="arrow-left" class="w-6 h-6 text-gray-600"></i>
            </a>
        </div>

        <?php if ($error): ?>
            <div class="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl flex items-center gap-3">
                <i data-lucide="alert-circle" class="w-5 h-5"></i>
                <span class="font-medium"><?php echo $error; ?></span>
            </div>
        <?php endif; ?>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Form Section -->
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20">
                    <form method="POST" id="posForm" class="space-y-8">
                        
                        <!-- 1. Product Selection -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="text-sm font-bold text-gray-600 uppercase tracking-wider ml-1">Select Item</label>
                                <select name="product_id" id="product_select" required 
                                    class="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-white/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg">
                                    <option value="" data-price="0">-- Search Jewelry --</option>
                                    <?php foreach ($products as $p): ?>
                                        <option value="<?php echo $p['id']; ?>" data-price="<?php echo $p['price']; ?>">
                                            <?php echo htmlspecialchars($p['name']); ?> (₱<?php echo number_format($p['price'], 0); ?>)
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="space-y-2">
                                <label class="text-sm font-bold text-gray-600 uppercase tracking-wider ml-1">Quantity</label>
                                <div class="relative">
                                    <input type="number" name="quantity" id="quantity_input" value="1" min="1" required 
                                        class="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-white/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg">
                                    <div class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">pcs</div>
                                </div>
                            </div>
                        </div>

                        <!-- 2. Payment Method Cards -->
                        <div class="space-y-3">
                            <label class="text-sm font-bold text-gray-600 uppercase tracking-wider ml-1">Payment Method</label>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <!-- Cash -->
                                <label class="relative group cursor-pointer">
                                    <input type="radio" name="payment_method" value="CASH" checked class="peer hidden" onclick="toggleRef(false)">
                                    <div class="p-4 rounded-xl border-2 border-gray-100 bg-white hover:bg-gray-50 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 transition-all text-center">
                                        <i data-lucide="banknote" class="w-6 h-6 mx-auto mb-2 text-emerald-600"></i>
                                        <p class="font-bold text-gray-800 text-sm">Cash</p>
                                    </div>
                                </label>

                                <!-- GCash -->
                                <label class="relative group cursor-pointer">
                                    <input type="radio" name="payment_method" value="GCASH" class="peer hidden" onclick="toggleRef(true)">
                                    <div class="p-4 rounded-xl border-2 border-gray-100 bg-white hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all text-center">
                                        <img src="payment/gcash-logo.png" class="w-8 h-8 mx-auto mb-2 object-contain">
                                        <p class="font-bold text-gray-800 text-sm">GCash</p>
                                    </div>
                                </label>

                                <!-- PayMaya -->
                                <label class="relative group cursor-pointer">
                                    <input type="radio" name="payment_method" value="PAYMAYA" class="peer hidden" onclick="toggleRef(true)">
                                    <div class="p-4 rounded-xl border-2 border-gray-100 bg-white hover:bg-gray-50 peer-checked:border-emerald-400 peer-checked:bg-emerald-50 transition-all text-center">
                                        <img src="payment/maya-logo.png" class="w-8 h-8 mx-auto mb-2 object-contain">
                                        <p class="font-bold text-gray-800 text-sm">Maya</p>
                                    </div>
                                </label>

                                <!-- GoTyme -->
                                <label class="relative group cursor-pointer">
                                    <input type="radio" name="payment_method" value="GOTYME" class="peer hidden" onclick="toggleRef(true)">
                                    <div class="p-4 rounded-xl border-2 border-gray-100 bg-white hover:bg-gray-50 peer-checked:border-pink-500 peer-checked:bg-pink-50 transition-all text-center">
                                        <img src="payment/gotyme-logo.png" class="w-8 h-8 mx-auto mb-2 object-contain">
                                        <p class="font-bold text-gray-800 text-sm">GoTyme</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- 3. Reference Field (Animated) -->
                        <div id="refField" class="hidden animate-fade-in space-y-2">
                            <label class="text-sm font-bold text-gray-600 uppercase tracking-wider ml-1">E-Wallet Reference Number</label>
                            <input type="text" name="reference_number" placeholder="Enter 13-digit Reference #" 
                                class="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-white/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all">
                        </div>

                        <button type="submit" name="complete_sale" 
                            class="w-full py-5 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold text-xl shadow-xl hover:shadow-gray-400/30 transform transition hover:-translate-y-1 flex items-center justify-center gap-3">
                            <i data-lucide="check-circle" class="w-6 h-6"></i>
                            Complete Transaction
                        </button>
                    </form>
                </div>
            </div>

            <!-- Summary Sidebar -->
            <div class="lg:col-span-1">
                <div class="sticky top-24 space-y-6">
                    <div class="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl text-white overflow-hidden relative">
                        <!-- Decorative Circle -->
                        <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        
                        <h3 class="text-lg font-semibold mb-6 opacity-80 uppercase tracking-widest">Order Summary</h3>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center opacity-90">
                                <span>Unit Price</span>
                                <span id="summary_price">₱0.00</span>
                            </div>
                            <div class="flex justify-between items-center opacity-90">
                                <span>Quantity</span>
                                <span id="summary_qty">1x</span>
                            </div>
                            <div class="pt-6 mt-6 border-t border-white/20 flex justify-between items-end">
                                <div>
                                    <p class="text-sm opacity-70 mb-1">Grand Total</p>
                                    <p class="text-4xl font-extrabold" id="summary_total">₱0.00</p>
                                </div>
                                <i data-lucide="receipt" class="w-10 h-10 opacity-30"></i>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white/50 p-6 rounded-2xl border border-dashed border-gray-300 text-gray-500 text-sm italic">
                        <i data-lucide="shield-check" class="w-4 h-4 inline mr-1 -mt-1"></i> 
                        Completing this sale will immediately update your inventory stock levels.
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        lucide.createIcons();

        const productSelect = document.getElementById('product_select');
        const qtyInput = document.getElementById('quantity_input');
        const summaryPrice = document.getElementById('summary_price');
        const summaryQty = document.getElementById('summary_qty');
        const summaryTotal = document.getElementById('summary_total');
        const refField = document.getElementById('refField');

        function updateSummary() {
            const selectedOption = productSelect.options[productSelect.selectedIndex];
            const price = parseFloat(selectedOption.getAttribute('data-price')) || 0;
            const qty = parseInt(qtyInput.value) || 0;
            const total = price * qty;

            summaryPrice.textContent = `₱${price.toLocaleString()}`;
            summaryQty.textContent = `${qty}x`;
            summaryTotal.textContent = `₱${total.toLocaleString()}`;
        }

        function toggleRef(show) {
            refField.classList.toggle('hidden', !show);
            const refInput = refField.querySelector('input');
            refInput.required = show;
            if(!show) refInput.value = "";
        }

        productSelect.addEventListener('change', updateSummary);
        qtyInput.addEventListener('input', updateSummary);
    </script>
</body>
</html>