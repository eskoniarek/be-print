import type { 
    MedusaRequest, 
    MedusaResponse,
  } from "@medusajs/medusa"
  import ProductMediaService 
    from "../../../services/product-media"
  import { MediaType } from "../../../models/product-media"
  
  export const GET = async (
    req: MedusaRequest, 
    res: MedusaResponse
  ) => {
    const productMediaService = req.scope.resolve<
      ProductMediaService
    >("productMediaService")
    // omitting pagination for simplicity
    const [
      productMedias,
      count,
    ] = await productMediaService.listAndCount({
      type: MediaType.PREVIEW,
      ...(req.query),
    }, {
      relations: ["variant"],
    })
  
    res.json({
      product_medias: productMedias,
      count,
    })
  }