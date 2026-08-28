import { getTenantByDomain } from '@/entities/tenant/api';
import { headers } from 'next/headers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RegulaminPage({ params }: { params: Promise<{ locale: string, tenantDomain: string }> }) {
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
            Regulamin świadczenia usług
          </h1>
          <p className="text-gray-500 text-sm">
            Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}
          </p>
        </header>

        <article className="prose prose-slate max-w-none space-y-6 text-base text-gray-800 leading-relaxed">
          <section>
            <h2 className="font-semibold text-xl text-gray-900 mb-2">§ 1. Postanowienia ogólne</h2>
            <p>
              1. Niniejszy Regulamin określa zasady korzystania ze strony internetowej oraz usług świadczonych drogą elektroniczną przez <strong>{legalCompanyName}</strong>
              {address ? `, z siedzibą pod adresem: ${address}` : ''}
              {nip ? `, NIP: ${nip}` : ''}{regon ? `, REGON: ${regon}` : ''}{krs ? `, KRS: ${krs}` : ''} (dalej: "Usługodawca").
            </p>
            <p>
              2. Strona internetowa działa w oparciu o infrastrukturę technologiczną platformy <strong>GoPublica</strong> (SaaS). 
              Dostawca platformy GoPublica dostarcza jedynie rozwiązanie techniczne i nie jest stroną umów zawieranych między Usługodawcą a Użytkownikiem (klientem).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-gray-900 mb-2">§ 2. Świadczenie usług i zawieranie umów</h2>
            <p>
              1. Za pośrednictwem strony Użytkownik może przeglądać ofertę, dokonywać rezerwacji (np. stolików, wizyt), składać zamówienia na produkty lub usługi oraz korzystać z formularzy kontaktowych.
            </p>
            <p>
              2. Do zawarcia umowy dochodzi w momencie zatwierdzenia zamówienia/rezerwacji przez Użytkownika i otrzymania potwierdzenia od Usługodawcy.
            </p>
            <p>
              3. Wszystkie ceny podawane na stronie są cenami brutto (zawierają podatek VAT) i wyrażone są w złotych polskich (PLN), chyba że wyraźnie zaznaczono inaczej.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-gray-900 mb-2">§ 3. Prawo odstąpienia od umowy (Ważne wyłączenia)</h2>
            <p>
              1. Zgodnie z Ustawą z dnia 30 maja 2014 r. o prawach konsumenta, Konsumentowi co do zasady przysługuje prawo odstąpienia od umowy zawartej na odległość w terminie 14 dni bez podania przyczyny.
            </p>
            <p>
              2. <strong>WYJĄTKI:</strong> Zgodnie z art. 38 pkt 12 ww. Ustawy, prawo odstąpienia od umowy <strong>NIE przysługuje</strong> Konsumentowi w odniesieniu do umów o świadczenie usług w zakresie:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
              <li><strong>gastronomii</strong> (np. zamówienia jedzenia na wynos lub z dowozem, które ulegają szybkiemu zepsuciu),</li>
              <li><strong>usług związanych z wypoczynkiem, wydarzeniami rozrywkowymi, sportowymi lub kulturalnymi</strong>, jeżeli w umowie oznaczono dzień lub okres świadczenia usługi (np. rezerwacja stolika, rezerwacja biletu na wydarzenie w lokalu na konkretny termin).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-gray-900 mb-2">§ 4. Reklamacje</h2>
            <p>
              1. Użytkownik ma prawo złożyć reklamację dotyczącą świadczonych usług.
            </p>
            <p>
              2. Reklamacje prosimy składać drogą elektroniczną na adres e-mail: <strong>{email || 'brak danych'}</strong>.
            </p>
            <p>
              3. Usługodawca zobowiązuje się do rozpatrzenia reklamacji w terminie 14 dni od jej otrzymania, informując Użytkownika o podjętej decyzji.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-xl text-gray-900 mb-2">§ 5. Wymagania techniczne i odpowiedzialność</h2>
            <p>
              1. Do prawidłowego korzystania ze strony wymagane jest urządzenie z dostępem do Internetu oraz nowoczesna przeglądarka internetowa (np. Chrome, Safari, Firefox).
            </p>
            <p>
              2. Usługodawca nie ponosi odpowiedzialności za przerwy w funkcjonowaniu strony wynikające z przyczyn niezależnych (np. awarie dostawców chmurowych Vercel/Hetzner, siła wyższa).
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