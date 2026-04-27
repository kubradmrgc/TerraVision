import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>TerraVision Web</h1>
      <p style={{ marginBottom: 16, color: '#52525b' }}>
        API ile konuşan demo sayfalar: giriş, ürün listesi ve sepet (SignalR ile canlı sepet olayları).
      </p>
      <ul style={{ lineHeight: 1.8 }}>
        <li>
          <Link href="/login">Giriş yap</Link>
        </li>
        <li>
          <Link href="/products">Ürünleri gör</Link>
        </li>
        <li>
          <Link href="/cart">Sepeti aç</Link>
        </li>
      </ul>
    </div>
  );
}
