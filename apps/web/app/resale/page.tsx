import Link from "next/link";
import { getHdbResales, hdbResaleSource, hdbTownSchema } from "@/shared/api/hdb-resale";

export const metadata = { title: "HDB resale transactions" };
export const dynamic = "force-dynamic";

const sgd = new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 });

export default async function ResalePage({ searchParams }: { searchParams: Promise<{ town?: string }> }) {
  const { town } = await searchParams;
  const filter = hdbTownSchema.safeParse(town);
  const invalid = town !== undefined && town !== "" && !filter.success;
  const rows = invalid ? null : await getHdbResales(filter.data).catch(() => null);

  return (
    <main className="container section">
      <Link href="/search">← Explore demo listings</Link>
      <h1 className="serif text-4xl">HDB resale transactions</h1>
      <p className="muted">Registered sales and historical prices. Source: <a className="underline" href={hdbResaleSource}>Housing &amp; Development Board via data.gov.sg</a>.</p>
      <form action="/resale" className="my-6 flex flex-wrap items-center gap-3">
        <label htmlFor="town">HDB town</label>
        <input id="town" name="town" defaultValue={filter.data} maxLength={40} placeholder="e.g. Tampines" className="field max-w-xs" />
        <button className="button button-primary">Search transactions</button>
      </form>
      {invalid ? <p role="alert">Enter an HDB town name.</p> : rows === null ? (
        <p role="alert">HDB data is temporarily unavailable. Please try again later.</p>
      ) : rows.length === 0 ? <p>No transactions matched that town.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <caption className="mb-3 text-left">Latest registered transactions (up to 10)</caption>
            <thead><tr>{["Month", "Town", "Block and street", "Flat type", "Area (m²)", "Resale price"].map((label) => <th key={label} scope="col" className="p-3">{label}</th>)}</tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={row._id} className="border-t">
                <td className="p-3">{row.month}</td>
                <td className="p-3">{row.town}</td>
                <td className="p-3">{row.block} {row.street_name}</td>
                <td className="p-3">{row.flat_type}</td>
                <td className="p-3">{row.floor_area_sqm}</td>
                <td className="p-3">{sgd.format(row.resale_price)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <p className="muted mt-5">This dataset provides block and street. Coordinates, postal districts, and MRT walking distances are unavailable here.</p>
    </main>
  );
}
