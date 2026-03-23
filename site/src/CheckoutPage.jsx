import { useEffect, useMemo, useState } from "react";
import emailjs from "@emailjs/browser";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Wallet,
  MessageCircle,
  Sparkles,
  Mail,
  Copy,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

/* ================= CONFIG ================= */

const packs = [
  {
    name: "Starter",
    price: "99€",
    features: ["1 page moderne", "Responsive", "Animations légères"],
    delay: "2 à 4 jours",
  },
  {
    name: "Pro",
    price: "199€",
    features: ["5 pages", "Design premium", "Animations avancées"],
    delay: "3 à 5 jours",
    popular: true,
  },
  {
    name: "Ultra",
    price: "Sur devis",
    features: ["Branding complet", "Effets premium", "Accompagnement"],
    delay: "Selon projet",
  },
];

function generateRef() {
  return "NF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

const stepCard =
  "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm px-4 py-3 transition";

/* ================= PAGE ================= */

export default function CheckoutPage() {
  const location = useLocation();

  const [selectedPack, setSelectedPack] = useState("Pro");
  const [email, setEmail] = useState("");
  const [orderRef, setOrderRef] = useState(generateRef());
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("paypal");

  const [isSending, setIsSending] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSelectedPack(params.get("pack") || "Pro");
    setEmail(params.get("email") || "");
    setOrderRef(generateRef());
  }, [location.search]);

  const selectedPlan = useMemo(() => {
    return packs.find((p) => p.name === selectedPack) || packs[1];
  }, [selectedPack]);

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(orderRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const sendOrder = async () => {
    if (paymentMethod === "card") {
      if (!email.trim()) {
        alert("Entre ton email avant de payer");
        return;
      }

      const localRef =
        "NF-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      localStorage.setItem(
        "nf_order",
        JSON.stringify({
          pack: selectedPlan.name,
          email,
          ref: localRef,
          method: "card",
        })
      );

      try {
        const response = await fetch("http://localhost:3001/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pack: selectedPlan.name,
            email,
            ref: localRef,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(data);
          alert("Erreur Stripe");
          return;
        }

        if (data.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        console.error(err);
        alert("Impossible de lancer le paiement Stripe.");
      }

      return;
    }

    if (!email.trim()) {
      setSendError("Ajoute ton email.");
      return;
    }

    setIsSending(true);
    setSendError("");
    setOrderSent(false);

    try {
      await emailjs.send(
        "service_pe128kh",
        "template_m767pgq",
        {
          pack: selectedPlan.name,
          email,
          ref: orderRef,
          method: paymentMethod,
        },
        "bS17uC8ls46E4T9hQ"
      );

      const res = await fetch("http://localhost:3001/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pack: selectedPlan.name,
          email,
          ref: orderRef,
          method: paymentMethod,
        }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        console.error(data);
        setSendError("Mail envoyé, mais ticket Discord impossible à créer.");
        setOrderSent(true);
        return;
      }

      setOrderSent(true);

      if (paymentMethod === "discord") {
        setTimeout(() => {
          window.open("https://discord.gg/vg9X5n6gyh", "_blank");
        }, 900);
      }
    } catch (err) {
      console.error(err);
      setSendError("Erreur lors de l'envoi.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030714] text-white relative overflow-hidden px-4 md:px-6 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,212,255,0.10),transparent_25%),radial-gradient(circle_at_85%_25%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.10),transparent_35%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_20%,transparent_80%,rgba(255,255,255,0.02))]" />

      <div className="relative z-10 flex justify-between items-center mb-10 max-w-7xl mx-auto">
        <Link
          to="/"
          className="flex items-center gap-2 text-white/60 hover:text-white transition"
        >
          <ArrowLeft size={18} /> Retour
        </Link>

        <div className="flex items-center gap-2 text-cyan-300 text-[11px] md:text-xs uppercase tracking-[0.2em]">
          <Sparkles size={14} /> Checkout sécurisé
        </div>
      </div>

      <div className="relative z-10 grid xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(7,15,44,0.95),rgba(7,10,34,0.88))] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_rgba(0,0,0,0.45)] p-8 md:p-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,238,255,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_30%)]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 text-xs">
              <ShieldCheck size={14} />
              Paiement encadré
            </div>

            <h1 className="text-4xl md:text-5xl font-black leading-none mb-8 tracking-tight">
              Finaliser ta commande
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {packs.map((pack) => {
                const isActive = selectedPack === pack.name;

                return (
                  <button
                    key={pack.name}
                    onClick={() => setSelectedPack(pack.name)}
                    className={`relative text-left rounded-[22px] border p-5 transition-all duration-300 overflow-hidden ${
                      isActive
                        ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_0_32px_rgba(34,211,238,0.14)]"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    {pack.popular && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-semibold bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-400/20">
                        Populaire
                      </div>
                    )}

                    <div className="text-2xl font-bold mb-1">{pack.name}</div>
                    <div className="text-cyan-300 text-2xl font-semibold mb-2">
                      {pack.price}
                    </div>
                    <div className="text-xs text-white/50 mb-4">{pack.delay}</div>

                    <ul className="space-y-2 text-sm text-white/75">
                      {pack.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-cyan-300 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div className="relative mb-4">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ton email"
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/[0.04] border border-white/10 outline-none text-white placeholder:text-white/40 focus:border-cyan-400/50 focus:bg-cyan-400/[0.03] transition"
              />
            </div>

            <div className="flex items-center justify-between h-14 px-4 mb-6 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="font-medium tracking-wide">{orderRef}</span>

              <button
                onClick={copyRef}
                className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition"
              >
                <Copy size={16} />
                <span className="text-sm">{copied ? "Copié" : ""}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setPaymentMethod("paypal")}
                className={`relative rounded-[22px] border p-6 transition-all duration-300 overflow-hidden ${
                  paymentMethod === "paypal"
                    ? "border-fuchsia-400 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 shadow-[0_0_0_1px_rgba(232,121,249,0.12),0_0_40px_rgba(217,70,239,0.18)]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex flex-col items-center gap-3 relative z-10">
                  <Wallet className="h-7 w-7 text-cyan-300" />
                  <span className="text-xl font-semibold">PayPal</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod("card")}
                className={`relative rounded-[22px] border p-6 transition-all duration-300 overflow-hidden ${
                  paymentMethod === "card"
                    ? "border-green-400 bg-green-500/20 shadow-[0_0_0_1px_rgba(34,197,94,0.2),0_0_40px_rgba(34,197,94,0.2)]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex flex-col items-center gap-3 relative z-10">
                  💳
                  <span className="text-xl font-semibold">Carte</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod("discord")}
                className={`relative rounded-[22px] border p-6 transition-all duration-300 overflow-hidden ${
                  paymentMethod === "discord"
                    ? "border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_0_40px_rgba(34,211,238,0.18)]"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex flex-col items-center gap-3 relative z-10">
                  <MessageCircle className="h-7 w-7 text-cyan-300" />
                  <span className="text-xl font-semibold">Discord</span>
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="relative rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(7,15,44,0.95),rgba(7,10,34,0.88))] shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-8 md:p-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(0,238,255,0.06),transparent_25%)]" />

          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-7">
              Résumé de la commande
            </h2>

            <div className="space-y-4 mb-7">
              <div className="h-14 flex items-center px-5 rounded-2xl border border-white/8 bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(168,85,247,0.08))]">
                {selectedPlan.price}
              </div>

              <div className="h-14 flex items-center px-5 rounded-2xl border border-white/8 bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(168,85,247,0.08))]">
                {email || "Email"}
              </div>

              <div className="h-14 flex items-center px-5 rounded-2xl border border-white/8 bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(168,85,247,0.08))]">
                {orderRef}
              </div>
            </div>

            {paymentMethod === "paypal" && (
              <div className="space-y-3 mb-7">
                <div className={stepCard}>1. Clique sur "Ouvrir PayPal"</div>
                <div className={stepCard}>2. Connecte toi à ton compte PayPal</div>
                <div className={stepCard}>3. Envoie le paiement</div>
                <div className={stepCard}>4. Reviens ici</div>
                <div className={stepCard}>5. Clique sur "J’ai payé"</div>
              </div>
            )}

            {paymentMethod === "card" && (
              <div className="space-y-3 mb-7">
                <div className={stepCard}>
                  <span className="text-cyan-300 font-semibold">1.</span> Clique sur{" "}
                  <span className="font-semibold">"Payer par carte"</span>
                </div>

                <div className={stepCard}>
                  <span className="text-cyan-300 font-semibold">2.</span> Une page Stripe sécurisée va s’ouvrir
                </div>

                <div className={stepCard}>
                  <span className="text-cyan-300 font-semibold">3.</span> Entre les informations de ta carte
                </div>

                <div className={stepCard}>
                  <span className="text-cyan-300 font-semibold">4.</span> Confirme le paiement
                </div>

                <div className={stepCard}>
                  <span className="text-cyan-300 font-semibold">5.</span> Tu seras redirigé automatiquement
                </div>
              </div>
            )}

            {paymentMethod === "discord" && (
              <div className="space-y-3 mb-7">
                <div className={stepCard}>1. Clique sur "Ouvrir Discord"</div>
                <div className={stepCard}>2. Accepte le règlement du serveur</div>
                <div className={stepCard}>3. Ouvre un ticket</div>
                <div className={stepCard}>4. Envoie ta référence :</div>

                <div className="rounded-2xl border border-cyan-400/15 bg-black/25 px-4 py-4 text-cyan-300 font-medium tracking-wide">
                  {orderRef}
                </div>

                <div className={stepCard}>5. Un membre du staff finalisera la commande</div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {paymentMethod === "discord" ? (
                <a
                  href="https://discord.gg/vg9X5n6gyh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center justify-center gap-3 h-16 rounded-2xl overflow-hidden font-semibold text-lg transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-600" />
                  <div className="absolute inset-0 opacity-40 group-hover:opacity-70 transition bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.22),transparent_25%),radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.18),transparent_25%)]" />
                  <div className="relative z-10 flex items-center gap-3">
                    <MessageCircle className="w-5 h-5" />
                    Ouvrir Discord
                  </div>
                </a>
              ) : paymentMethod === "card" ? (
                <button
                  onClick={sendOrder}
                  className="group relative flex items-center justify-center gap-3 h-16 rounded-2xl overflow-hidden font-semibold text-lg transition hover:scale-[1.01]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500" />
                  <div className="relative z-10">Payer par carte</div>
                </button>
              ) : (
                <a
                  href="https://paypal.me/Tomprs237"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center justify-center gap-3 h-16 rounded-2xl overflow-hidden font-semibold text-lg transition hover:scale-[1.01]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-sky-300 to-fuchsia-500" />
                  <div className="relative z-10">Ouvrir PayPal</div>
                </a>
              )}

              <p className="text-sm text-white/45 text-center">
                Envoie la preuve de paiement dans un ticket Discord
              </p>

              <button
                onClick={sendOrder}
                disabled={isSending}
                className="h-16 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition text-lg font-semibold disabled:opacity-50"
              >
                {isSending ? "Envoi..." : "J’ai payé"}
              </button>
            </div>

            {sendError && (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-red-300">
                {sendError}
              </div>
            )}

            {orderSent && (
              <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-4 text-sm text-cyan-100">
                ✅ Commande envoyée.
                <br />
                Continue sur Discord avec ta capture ou les infos de paiement.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}