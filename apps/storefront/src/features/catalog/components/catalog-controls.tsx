import type { CatalogSort } from "../data/catalog-api";

type CatalogControlsProps = {
  query: string;
  category: string;
  sort: CatalogSort;
  categories: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
};

export function CatalogControls({
  query,
  category,
  sort,
  categories,
  minPrice,
  maxPrice,
  inStock,
}: CatalogControlsProps) {
  const filtering = Boolean(query || category || sort !== "newest" || minPrice != null || maxPrice != null || inStock);

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
        <span>Min price (RM)</span>
        <input name="minPrice" type="number" min="0" step="0.01" defaultValue={minPrice} />
      </label>

      <label className="catalog-select">
        <span>Max price (RM)</span>
        <input name="maxPrice" type="number" min="0" step="0.01" defaultValue={maxPrice} />
      </label>

      <label className="catalog-select">
        <span>Availability</span>
        <select name="inStock" defaultValue={inStock ? "true" : ""}>
          <option value="">All products</option>
          <option value="true">In stock only</option>
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
