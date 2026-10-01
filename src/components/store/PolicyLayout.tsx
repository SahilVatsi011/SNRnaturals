import { business, whatsappDigits } from "@/config/business";

export function PolicyLayout({
  title,
  showLastUpdated = false,
  children,
}: {
  title: string;
  showLastUpdated?: boolean;
  children: React.ReactNode;
}) {
  const c = business.contact;
  const waDigits = whatsappDigits();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12 lg:px-8">
      <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
      {showLastUpdated && (
        <p className="mt-1 text-sm text-gray-400">Last updated: {business.legal.lastUpdated}</p>
      )}

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-gray-600 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-800 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-brand-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand-700">
        {children}
      </div>

      {/* Contact box */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-700">Questions? Contact us</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
          <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="transition-colors hover:text-brand-600">
            {c.phone}
          </a>
          <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-brand-600">
            WhatsApp
          </a>
          <a href={`mailto:${c.email}`} className="transition-colors hover:text-brand-600">
            {c.email}
          </a>
        </div>
      </div>
    </div>
  );
}
