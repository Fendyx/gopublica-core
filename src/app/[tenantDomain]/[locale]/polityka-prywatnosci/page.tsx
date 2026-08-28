import { getTenantByDomain } from '@/entities/tenant/api';
import { headers } from 'next/headers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PolitykaPrywatnosciPage({ params }: { params: Promise<{ locale: string, tenantDomain: string }> }) {
  const { locale, tenantDomain } = await params;
  const headersList = await headers();
  const host = headersList.get('host') ?? tenantDomain;
  
  const tenant = await getTenantByDomain(host);

  const tAny = tenant as any;
  const companyName = tAny?.businessName || '';
  const legal = tAny?.legal || tAny?.settings?.legal || {};
  
  const legalCompanyName = legal.legalCompanyName || companyName;
  const nip = legal.nip || '';
  const regon = legal.regon || '';
  const krs = legal.krs || '';
  const address = tAny?.address || tAny?.contact?.address || '';
  const email = tAny?.email || tAny?.contact?.email || '';
  const phone = tAny?.phone || tAny?.contact?.phone || '';

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4 border-b pb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900">
            Polityka prywatności
          </h1>
          <p className="text-gray-500 text-sm">
            Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}
          </p>
        </header>

        <article className="prose prose-slate max-w-none space-y-6 text-base text-gray-800 leading-relaxed">
          <section>
            <h2 className="font-semibold text-xl text-gray-900 mb-2">1. Administrator danych osobowych</h2>
            <p>
              Administratorem Twoich danych osobowych jest <strong>{legalCompanyName}</strong>
              {address ? `, z siedzibą pod adresem: ${address}` : ''}
              {nip ? `, NIP: ${nip}` : ''}{regon ? `, REGON: ${regon}` : ''}{krs ? `, KRS: ${krs}` : ''}.
            </p>
            <p>
              W sprawach związanych z ochroną danych osobowych możesz skontaktować się z nami pod adresem e-mail: <strong>{email || 'brak danych'}</strong>
              {phone ? ` lub telefonicznie: ${phone}` : ''}.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-gray-900 mb-2">2. Cele i podstawy przetwarzania danych</h2>
            <p>Przetwarzamy Twoje dane w następujących celach:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
              <li><strong>Realizacja zamówień i rezerwacji</strong> (art. 6 ust. 1 lit. b RODO) – dane niezbędne do wykonania umowy.</li>
              <li><strong>Obsługa zapytań i komunikacja</strong> (art. 6 ust. 1 lit. f RODO) – nasz prawnie uzasadniony interes.</li>
              <li><strong>Rozliczenia księgowe i podatkowe</strong> (art. 6 ust. 1 lit. c RODO) – obowiązek prawny.</li>
              <li><strong>Zapewnienie bezpieczeństwa i analityka działania strony</strong> (art. 6 ust. 1 lit. f RODO).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-gray-900 mb-2">3. Odbiorcy danych (Podmioty przetwarzające)</h2>
            <p>
              Dla prawidłowego funkcjonowania naszej strony internetowej oraz obsługi zamówień i rezerwacji, 
              korzystamy z usług zewnętrznych dostawców infrastruktury technicznej (tzw. SaaS). Twoje dane mogą być powierzane:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
              <li><strong>GoPublica</strong> – dostawca oprogramowania systemu e-commerce i rezerwacji, na którym oparta jest nasza strona.</li>
              <li><strong>Hetzner Online GmbH</strong> (Niemcy, EOG) – dostawca bezpiecznych serwerów i baz danych (PostgreSQL).</li>
              <li><strong>Vercel Inc.</strong> (USA/UE) – dostawca usług hostingowych i infrastruktury chmurowej.</li>
              <li><strong>Stripe</strong> – operator płatności internetowych (w przypadku opłacania zamówień online).</li>
            </ul>
            <p>
              Przekazywanie danych do podmiotów z siedzibą poza Europejskim Obszarem Gospodarczym (np. Vercel Inc.) 
              odbywa się wyłącznie w oparciu o odpowiednie zabezpieczenia prawne, takie jak Standardowe Klauzule Umowne (SCC) 
              lub porozumienie Data Privacy Framework.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-gray-900 mb-2">4. Pliki cookies i analityka</h2>
            <p>
              Nasza strona została zaprojektowana z myślą o maksymalnej ochronie prywatności. 
              Zasadniczo <strong>nie wykorzystujemy ciasteczek (cookies) śledzących ani marketingowych</strong>.
            </p>
            <p>
              Wykorzystujemy jedynie system Vercel Web Analytics w celu gromadzenia ogólnych, zanonimizowanych danych o ruchu na stronie 
              (np. liczba odwiedzin, rodzaj przeglądarki). System ten działa bez wykorzystywania plików cookies, 
              nie pozwala na identyfikację konkretnego użytkownika, a adresy IP są anonimizowane.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-gray-900 mb-2">5. Twoje prawa (RODO)</h2>
            <p>
              Masz prawo żądać dostępu do swoich danych, ich sprostowania, usunięcia ("prawo do bycia zapomnianym"), 
              ograniczenia przetwarzania, prawo do przenoszenia danych oraz prawo wniesienia sprzeciwu. 
              W tym celu skontaktuj się z nami pod adresem e-mail podanym w pkt 1. 
              Przysługuje Ci również prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (PUODO).
            </p>
          </section>

          <hr className="border-gray-200 my-8" />

          <p className="text-sm text-gray-500 text-center bg-gray-50 p-4 rounded-lg">
            <strong>{legalCompanyName}</strong> {address ? `• ${address}` : ''} <br/>
            NIP: {nip || 'brak danych'} • REGON: {regon || 'brak danych'} {krs ? `• KRS: ${krs}` : ''} <br/>
            E-mail: {email || 'brak danych'} {phone ? `• Tel: ${phone}` : ''}
          </p>
        </article>

        <nav className="text-center pt-6">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium">
            ← Powrót na stronę główną
          </Link>
        </nav>
      </div>
    </main>
  );
}