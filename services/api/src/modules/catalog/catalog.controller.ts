import { Controller, Get } from "@nestjs/common";

@Controller("products")
export class CatalogController {
  @Get()
  listProducts() {
    return {
      data: [],
      meta: { source: "placeholder", message: "Prisma-backed catalog arrives in the next phase." },
    };
  }
}
