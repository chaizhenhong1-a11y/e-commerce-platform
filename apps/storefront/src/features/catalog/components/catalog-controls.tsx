import type { CatalogSort } from "../data/catalog-api";

type CatalogControlsProps = {
  query: string;
  category: string;
  sort: CatalogSort;
  categories: string[];
};

export function CatalogControls({
  query,
  category,
  sort,
  categories,
}: CatalogControlsProps) {
  const filtering = Boolean(query || category || sort !== "newest");

  return (
    <form className="catalog-controls" action="/#shop" method="get">
      {query ? <input type="hidden" name="q" value={query} /> : null}

      <label className="catalog-select">
        <span>Category</span>
        <select name="category" defaultValue={category}>
          <option value="">All categories</option>
          {categories.map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="catalog-select">
        <span>Sort products</span>
        <select name="sort" defaultValue={sort}>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name: A–Z</option>
        </select>
      </label>

      <button className="button button--primary" type="submit">
        Apply filters
      </button>

      {filtering ? (
        <a className="catalog-reset" href="/#shop">
          Clear all
        </a>
      ) : null}
    </form>
  );
}
