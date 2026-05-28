import { Database } from "bun:sqlite";
import { BrowserWindow, Updater, Utils } from "electrobun/bun";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;
const API_PORT = 3001;

async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log(
				"Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
			);
		}
	}
	return "views://mainview/index.html";
}

const DATA_DIR = Utils.paths.userData || `${Utils.paths.appData}/khata-plus`;

function ensureDir(dir: string) {
	try {
		Bun.write(Bun.file(`${dir}/.keep`), "");
	} catch {}
}

ensureDir(DATA_DIR);

const db = new Database(`${DATA_DIR}/khata.db`, { create: true });
db.exec("PRAGMA journal_mode = WAL");

db.exec(`CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL DEFAULT '',
  tax REAL NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0
)`);

db.exec(`CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  items TEXT NOT NULL,
  subtotal REAL NOT NULL,
  tax REAL NOT NULL,
  total REAL NOT NULL,
  payment_method TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  party_id TEXT DEFAULT NULL
)`);

db.exec(`CREATE TABLE IF NOT EXISTS parties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  balance REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
)`);

db.exec(`CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
)`);

db.exec(`CREATE TABLE IF NOT EXISTS party_payments (
  id TEXT PRIMARY KEY,
  party_id TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  timestamp INTEGER NOT NULL
)`);

try { db.exec("ALTER TABLE products ADD COLUMN tax REAL NOT NULL DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE transactions ADD COLUMN party_id TEXT DEFAULT NULL"); } catch {}
try { db.exec("ALTER TABLE products ADD COLUMN image TEXT NOT NULL DEFAULT ''"); } catch {}
try { db.exec("UPDATE products SET image = emoji WHERE image = '' AND emoji IS NOT NULL AND emoji != ''"); } catch {}
try { db.exec("ALTER TABLE products ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 0"); } catch {}

db.exec(`CREATE TABLE IF NOT EXISTS business_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  name TEXT NOT NULL DEFAULT 'Khata POS',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  gst TEXT NOT NULL DEFAULT ''
)`);

const catCount = db.query("SELECT COUNT(*) as count FROM categories").get() as { count: number };
if (catCount.count === 0) {
	const seedCat = db.prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
	db.transaction(() => {
		const names = ["Beverages", "Snacks", "Groceries", "Fast Food", "Dairy", "Bakery"];
		for (const n of names) seedCat.run(crypto.randomUUID(), n);
	})();
	console.log("Seeded categories table");
}

const existing = db.query("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (existing.count === 0) {
	const seed = db.prepare(`INSERT INTO products (id, name, price, category, stock, image, tax, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
	db.transaction(() => {
		const products: [string, string, number, string, number, string, number, number][] = [
			["p1", "Cola", 1.5, "Beverages", 100, "", 5, 10],
			["p2", "Water", 1.0, "Beverages", 100, "", 0, 10],
			["p3", "Orange Juice", 2.5, "Beverages", 80, "", 5, 5],
			["p4", "Coffee", 2.0, "Beverages", 90, "", 5, 5],
			["p5", "Tea", 1.5, "Beverages", 90, "", 0, 5],
			["p6", "Energy Drink", 3.0, "Beverages", 60, "", 10, 5],
			["p7", "Potato Chips", 2.0, "Snacks", 100, "", 5, 10],
			["p8", "Chocolate Bar", 1.75, "Snacks", 100, "", 0, 10],
			["p9", "Cookie Pack", 2.5, "Snacks", 80, "", 5, 5],
			["p10", "Candy", 0.75, "Snacks", 150, "", 0, 20],
			["p11", "Popcorn", 1.5, "Snacks", 90, "", 5, 5],
			["p12", "Crackers", 1.25, "Snacks", 70, "", 0, 5],
			["p13", "White Rice", 5.0, "Groceries", 50, "", 0, 10],
			["p14", "Pasta", 3.0, "Groceries", 60, "", 5, 5],
			["p15", "Cooking Oil", 8.0, "Groceries", 40, "", 0, 5],
			["p16", "Sugar", 2.0, "Groceries", 70, "", 0, 10],
			["p17", "Flour", 2.5, "Groceries", 60, "", 0, 10],
			["p18", "Salt", 1.0, "Groceries", 100, "", 0, 10],
			["p19", "Pizza Slice", 4.0, "Fast Food", 30, "", 10, 5],
			["p20", "Burger", 5.0, "Fast Food", 25, "", 10, 5],
			["p21", "Hot Dog", 3.5, "Fast Food", 35, "", 10, 5],
			["p22", "French Fries", 3.0, "Fast Food", 40, "", 5, 5],
			["p23", "Sandwich", 4.5, "Fast Food", 20, "", 5, 5],
			["p24", "Chicken Wrap", 5.5, "Fast Food", 25, "", 10, 5],
			["p25", "Milk", 3.0, "Dairy", 50, "", 0, 10],
			["p26", "Yogurt", 1.5, "Dairy", 60, "", 0, 10],
			["p27", "Cheese", 4.0, "Dairy", 40, "", 5, 5],
			["p28", "Butter", 3.5, "Dairy", 45, "", 5, 5],
			["p29", "Eggs (6pk)", 3.0, "Dairy", 50, "", 0, 10],
			["p30", "Bread Loaf", 2.5, "Bakery", 40, "", 0, 10],
			["p31", "Croissant", 2.0, "Bakery", 35, "", 5, 5],
			["p32", "Muffin", 2.5, "Bakery", 30, "", 5, 5],
			["p33", "Donut", 1.5, "Bakery", 45, "", 0, 10],
			["p34", "Bagel", 2.0, "Bakery", 30, "", 0, 5],
			["p35", "Cake Slice", 4.5, "Bakery", 15, "", 5, 5],
			["p36", "Pie Slice", 4.0, "Bakery", 20, "", 5, 5],
		];
		for (const p of products) {
			seed.run(...p);
		}
	})();
	console.log("Seeded products table");
}

const getProducts = db.prepare("SELECT * FROM products ORDER BY category, name");
const getTransactions = db.prepare("SELECT * FROM transactions ORDER BY timestamp DESC");
const insertTransaction = db.prepare(`INSERT INTO transactions (id, items, subtotal, tax, total, payment_method, timestamp, party_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const deleteTransaction = db.prepare("DELETE FROM transactions WHERE id = ?");
const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");
const lowStockQuery = db.prepare("SELECT * FROM products WHERE min_stock > 0 AND stock <= min_stock ORDER BY CAST(stock AS REAL) / CAST(min_stock AS REAL) ASC");
const insertProduct = db.prepare(`INSERT INTO products (id, name, price, category, stock, image, tax, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const updateProduct = db.prepare("UPDATE products SET name = ?, price = ?, category = ?, stock = ?, image = ?, tax = ?, min_stock = ? WHERE id = ?");
const deleteProduct = db.prepare("DELETE FROM products WHERE id = ?");

const insertParty = db.prepare("INSERT INTO parties (id, name, phone, address, balance, created_at) VALUES (?, ?, ?, ?, ?, ?)");
const updateParty = db.prepare("UPDATE parties SET name = ?, phone = ?, address = ? WHERE id = ?");
const deleteParty = db.prepare("DELETE FROM parties WHERE id = ?");
const getParties = db.prepare("SELECT * FROM parties ORDER BY name");
const getParty = db.prepare("SELECT * FROM parties WHERE id = ?");

const getPartyTransactions = db.prepare("SELECT * FROM transactions WHERE party_id = ? ORDER BY timestamp DESC");
const addPartyBalance = db.prepare("UPDATE parties SET balance = balance + ? WHERE id = ?");
const subtractPartyBalance = db.prepare("UPDATE parties SET balance = balance - ? WHERE id = ?");

const getCategories = db.prepare("SELECT * FROM categories ORDER BY name");
const insertCategory = db.prepare("INSERT INTO categories (id, name) VALUES (?, ?)");
const updateCategory = db.prepare("UPDATE categories SET name = ? WHERE id = ?");
const deleteCategory = db.prepare("DELETE FROM categories WHERE id = ?");

const getPartyPayments = db.prepare("SELECT * FROM party_payments WHERE party_id = ? ORDER BY timestamp DESC");
const insertPartyPayment = db.prepare("INSERT INTO party_payments (id, party_id, amount, note, timestamp) VALUES (?, ?, ?, ?, ?)");

function corsHeaders(origin: string) {
	return {
		"Access-Control-Allow-Origin": origin || "*",
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Content-Type": "application/json",
	};
}

Bun.serve({
	port: API_PORT,
	async fetch(req) {
		const url = new URL(req.url);
		const origin = req.headers.get("Origin") || "*";

		if (req.method === "OPTIONS") {
			return new Response(null, {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname === "/api/products" && req.method === "GET") {
			const rows = getProducts.all() as Array<Record<string, unknown>>;
			const products = rows.map((r) => ({
				id: r.id,
				name: r.name,
				price: r.price,
				category: r.category,
				stock: r.stock,
				image: r.image,
				tax: r.tax,
				minStock: r.min_stock,
			}));
			return new Response(JSON.stringify(products), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname === "/api/transactions" && req.method === "GET") {
			const rows = getTransactions.all() as Array<Record<string, unknown>>;
			const data = rows.map((row) => ({
				id: row.id,
				items: JSON.parse(row.items as string),
				subtotal: row.subtotal,
				tax: row.tax,
				total: row.total,
				paymentMethod: row.payment_method,
				timestamp: row.timestamp,
				partyId: row.party_id || undefined,
			}));
			return new Response(JSON.stringify(data), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname === "/api/transactions" && req.method === "POST") {
			const body = (await req.json()) as Record<string, unknown>;
			const items = body.items as Array<{ product: { id: string; name: string }; quantity: number }>;

			const stockErrors: string[] = [];
			const deduct = db.transaction(() => {
				insertTransaction.run(
					body.id as string,
					JSON.stringify(items),
					body.subtotal as number,
					body.tax as number,
					body.total as number,
					body.paymentMethod as string,
					body.timestamp as number,
					(body.partyId as string) || null,
				);
				for (const item of items) {
					const result = updateStock.run(item.quantity, item.product.id, item.quantity);
					if (result.changes === 0) {
						stockErrors.push(item.product.name);
					}
				}
				if (body.paymentMethod === "credit" && body.partyId) {
					addPartyBalance.run(body.total as number, body.partyId as string);
				}
				if (stockErrors.length > 0) {
					throw new Error(`Insufficient stock: ${stockErrors.join(", ")}`);
				}
			});

			try {
				deduct();
			} catch (e) {
				return new Response(JSON.stringify({ error: (e as Error).message }), {
					status: 409,
					headers: corsHeaders(origin),
				});
			}

			return new Response(JSON.stringify(body), {
				status: 201,
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname.startsWith("/api/transactions/") && req.method === "DELETE") {
			const id = url.pathname.split("/").pop() as string;
			const tx = db.query("SELECT * FROM transactions WHERE id = ?").get(id) as Record<string, unknown> | null;
			if (tx && tx.payment_method === "credit" && tx.party_id) {
				subtractPartyBalance.run(tx.total as number, tx.party_id as string);
			}
			deleteTransaction.run(id);
			return new Response(JSON.stringify({ deleted: id }), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname === "/api/products/low-stock" && req.method === "GET") {
			const rows = lowStockQuery.all() as Array<Record<string, unknown>>;
			const products = rows.map((r) => ({
				id: r.id,
				name: r.name,
				price: r.price,
				category: r.category,
				stock: r.stock,
				image: r.image,
				tax: r.tax,
				minStock: r.min_stock,
			}));
			return new Response(JSON.stringify(products), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname === "/api/products" && req.method === "POST") {
			const body = (await req.json()) as Record<string, unknown>;
			insertProduct.run(
				(body.id as string) || crypto.randomUUID(),
				body.name as string,
				body.price as number,
				body.category as string,
				body.stock as number,
				(body.image as string) || "",
				(body.tax as number) || 0,
				(body.minStock as number) || 0,
			);
			return new Response(JSON.stringify(body), {
				status: 201,
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname.startsWith("/api/products/") && req.method === "PUT") {
			const id = url.pathname.split("/").pop() as string;
			const body = (await req.json()) as Record<string, unknown>;
			updateProduct.run(body.name as string, body.price as number, body.category as string, body.stock as number, (body.image as string) || "", (body.tax as number) || 0, (body.minStock as number) || 0, id);
			return new Response(JSON.stringify({ updated: id }), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname.startsWith("/api/products/") && req.method === "DELETE") {
			const id = url.pathname.split("/").pop() as string;
			deleteProduct.run(id);
			return new Response(JSON.stringify({ deleted: id }), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname === "/api/reports/daily" && req.method === "GET") {
			const rows = db.query(`SELECT date(timestamp / 1000, 'unixepoch') as day, SUM(total) as revenue, COUNT(*) as count FROM transactions GROUP BY day ORDER BY day DESC LIMIT 30`).all();
			return new Response(JSON.stringify(rows), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname === "/api/reports/top-products" && req.method === "GET") {
			const txRows = getTransactions.all() as Array<{ items: string }>;
			const productMap = new Map<string, { name: string; image: string; quantity: number; revenue: number }>();
			for (const row of txRows) {
				const items = JSON.parse(row.items) as Array<{ product: { id: string; name: string; image?: string; emoji?: string; price: number }; quantity: number }>;
				for (const item of items) {
					const existing = productMap.get(item.product.id) || { name: item.product.name, image: item.product.image || item.product.emoji || "", quantity: 0, revenue: 0 };
					existing.quantity += item.quantity;
					existing.revenue += item.product.price * item.quantity;
					productMap.set(item.product.id, existing);
				}
			}
			const sorted = Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 20);
			return new Response(JSON.stringify(sorted), {
				headers: corsHeaders(origin),
			});
		}

		// ---- Party Routes ----

		if (url.pathname === "/api/parties" && req.method === "GET") {
			const parties = getParties.all();
			return new Response(JSON.stringify(parties), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname === "/api/parties" && req.method === "POST") {
			const body = (await req.json()) as Record<string, unknown>;
			insertParty.run(
				(body.id as string) || crypto.randomUUID(),
				body.name as string,
				(body.phone as string) || "",
				(body.address as string) || "",
				(body.balance as number) || 0,
				Date.now(),
			);
			return new Response(JSON.stringify(body), {
				status: 201,
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname.startsWith("/api/parties/") && req.method === "PUT") {
			const id = url.pathname.split("/").pop() as string;
			const body = (await req.json()) as Record<string, unknown>;
			updateParty.run(body.name as string, (body.phone as string) || "", (body.address as string) || "", id);
			return new Response(JSON.stringify({ updated: id }), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname.startsWith("/api/parties/") && req.method === "DELETE") {
			const id = url.pathname.split("/").pop() as string;
			deleteParty.run(id);
			return new Response(JSON.stringify({ deleted: id }), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname.match(/^\/api\/parties\/[^\/]+\/transactions$/) && req.method === "GET") {
			const id = url.pathname.split("/")[3];
			const rows = getPartyTransactions.all(id) as Array<Record<string, unknown>>;
			const data = rows.map((row) => ({
				id: row.id,
				items: JSON.parse(row.items as string),
				subtotal: row.subtotal,
				tax: row.tax,
				total: row.total,
				paymentMethod: row.payment_method,
				timestamp: row.timestamp,
				partyId: row.party_id || undefined,
			}));
			return new Response(JSON.stringify(data), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname.match(/^\/api\/parties\/[^\/]+\/payments$/) && req.method === "GET") {
			const id = url.pathname.split("/")[3];
			const payments = getPartyPayments.all(id);
			return new Response(JSON.stringify(payments), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname.match(/^\/api\/parties\/[^\/]+\/pay$/) && req.method === "POST") {
			const id = url.pathname.split("/")[3];
			const body = (await req.json()) as Record<string, unknown>;
			const amount = Math.abs(body.amount as number);
			if (amount <= 0) {
				return new Response(JSON.stringify({ error: "Amount must be positive" }), {
					status: 400,
					headers: corsHeaders(origin),
				});
			}
			const pay = db.transaction(() => {
				const result = subtractPartyBalance.run(amount, id);
				if (result.changes === 0) {
					throw new Error("Party not found");
				}
				insertPartyPayment.run(
					(body.id as string) || crypto.randomUUID(),
					id,
					amount,
					(body.note as string) || "",
					Date.now(),
				);
			});
			try {
				pay();
			} catch (e) {
				return new Response(JSON.stringify({ error: (e as Error).message }), {
					status: 409,
					headers: corsHeaders(origin),
				});
			}
			return new Response(JSON.stringify({ success: true, amount }), {
				status: 200,
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname.match(/^\/api\/parties\/[^\/]+$/) && req.method === "GET") {
			const id = url.pathname.split("/").pop() as string;
			const party = getParty.get(id);
			if (!party) {
				return new Response(JSON.stringify({ error: "Party not found" }), {
					status: 404,
					headers: corsHeaders(origin),
				});
			}
			return new Response(JSON.stringify(party), {
				headers: corsHeaders(origin),
			});
		}

		// ---- Category Routes ----

		if (url.pathname === "/api/categories" && req.method === "GET") {
			const categories = getCategories.all();
			return new Response(JSON.stringify(categories), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname === "/api/categories" && req.method === "POST") {
			const body = (await req.json()) as Record<string, unknown>;
			if (!body.name) {
				return new Response(JSON.stringify({ error: "Name is required" }), {
					status: 400,
					headers: corsHeaders(origin),
				});
			}
			try {
				insertCategory.run((body.id as string) || crypto.randomUUID(), body.name as string);
			} catch {
				return new Response(JSON.stringify({ error: "Category already exists" }), {
					status: 409,
					headers: corsHeaders(origin),
				});
			}
			return new Response(JSON.stringify(body), {
				status: 201,
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname.startsWith("/api/categories/") && req.method === "PUT") {
			const id = url.pathname.split("/").pop() as string;
			const body = (await req.json()) as Record<string, unknown>;
			if (!body.name) {
				return new Response(JSON.stringify({ error: "Name is required" }), {
					status: 400,
					headers: corsHeaders(origin),
				});
			}
			updateCategory.run(body.name as string, id);
			return new Response(JSON.stringify({ updated: id }), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname.startsWith("/api/categories/") && req.method === "DELETE") {
			const id = url.pathname.split("/").pop() as string;
			deleteCategory.run(id);
			return new Response(JSON.stringify({ deleted: id }), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname === "/api/business" && req.method === "GET") {
			const settings = db.query("SELECT * FROM business_settings WHERE id = 'main'").get() as Record<string, unknown> | null;
			return new Response(JSON.stringify(settings || { name: "Khata POS", address: "", phone: "", gst: "" }), {
				headers: corsHeaders(origin),
			});
		}

		if (url.pathname === "/api/business" && req.method === "PUT") {
			const body = (await req.json()) as Record<string, unknown>;
			db.query(`INSERT INTO business_settings (id, name, address, phone, gst) VALUES ('main', ?, ?, ?, ?)
				ON CONFLICT(id) DO UPDATE SET name = excluded.name, address = excluded.address, phone = excluded.phone, gst = excluded.gst`)
				.run(body.name as string, body.address as string, body.phone as string, body.gst as string);
			return new Response(JSON.stringify({ success: true }), {
				headers: corsHeaders(origin),
			});
		}

		return new Response("Not Found", { status: 404, headers: corsHeaders(origin) });
	},
});

console.log(`API server running at http://localhost:${API_PORT}`);

async function checkForUpdates() {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") return;

	try {
		const updateInfo = await Updater.checkForUpdate();
		if (updateInfo.updateReady) {
			console.log("Staged update found, applying...");
			await Updater.applyUpdate();
			return;
		}
		if (updateInfo.updateAvailable) {
			console.log(`Update v${updateInfo.version} available, downloading...`);
			await Updater.downloadUpdate();
			console.log("Update ready — will apply on next restart");
		}
	} catch (err) {
		console.log("Update check failed:", err);
	}

	setInterval(async () => {
		try {
			const info = await Updater.checkForUpdate();
			if (info.updateAvailable) {
				await Updater.downloadUpdate();
				console.log("Update ready — will apply on next restart");
			}
		} catch {}
	}, 60 * 60 * 1000);
}

const url = await getMainViewUrl();

if (Updater.updateInfo()?.updateReady) {
	await Updater.applyUpdate();
}

const mainWindow = new BrowserWindow({
	title: "Khata Plus",
	url,
	frame: {
		width: 1280,
		height: 800,
		x: 100,
		y: 50,
	},
});

checkForUpdates();

console.log("Khata Plus app started!");
