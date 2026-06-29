import Link from 'next/link';

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="nf">
      <div className="nf__inner">
        <img src="/logo.png" alt="Dillora by Kashvin" className="nf__logo" />
        <span className="nf__code">404</span>
        <h1 className="nf__title">This little thing wandered off.</h1>
        <p className="nf__text">
          The page you’re looking for doesn’t exist or may have moved.
          Let’s get you back to something handmade.
        </p>
        <div className="nf__actions">
          <Link href="/" className="btn btn-primary btn-lg">Back to home</Link>
          <Link href="/c/mobile-covers" className="btn btn-ghost btn-lg">Shop the collection</Link>
        </div>
      </div>
    </div>
  );
}
