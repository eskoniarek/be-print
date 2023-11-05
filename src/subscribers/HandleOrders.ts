import { 
    AbstractFileService, 
    EventBusService, 
    OrderService,
  } from "@medusajs/medusa"
  import ProductMediaService from "../services/product-media"  // Adjust the path accordingly
  
  type InjectedDependencies = {
    eventBusService: EventBusService
    sendgridService: any
    orderService: OrderService
    fileService: AbstractFileService
    productMediaService: ProductMediaService  // Add this line
  }
  
  class HandleOrderSubscribers {
    protected readonly orderService_: OrderService
    protected sendGridService_: any
    protected readonly fileService_: AbstractFileService
    protected readonly productMediaService_: ProductMediaService  // Add this line
  
    constructor({ 
      eventBusService, 
      sendgridService,
      orderService, 
      fileService,
      productMediaService,  // Add this line
    }: InjectedDependencies) {
      this.sendGridService_ = sendgridService
      this.orderService_ = orderService
      this.fileService_ = fileService
      this.productMediaService_ = productMediaService  // Add this line
      eventBusService.subscribe(
        "order.placed", 
        this.handleOrderPlaced
      )
    }
  
    handleOrderPlaced = async (
      data: Record<string, any>
    ) => {
      const order = await this.orderService_.retrieve(data.id, {
        relations: [
          "items", 
          "items.variant",
          "customer"
        ],
      })
  
      // find product medias in the order
      const urls = []
      for (const item of order.items) {
        const productMedias = await this.productMediaService_.list({
          variant_id: item.variant_id
        });
  
        await Promise.all(
          productMedias.map(async (productMedia) => {
            // get the download URL from the file service
            const downloadUrl = await 
              this.fileService_.getPresignedDownloadUrl({
                fileKey: productMedia.file_key,
                isPrivate: true,
              })
  
            urls.push(downloadUrl)
          })
        )
      }
      if (urls.length) {
        console.log('Digital Products URLs:', urls);
        // Prepare items in the format required by your SendGrid template
        const itemDetails = order.items.map((item) => ({
          quantity: item.quantity,
          price: (item.unit_price / 100).toFixed(2), // Assuming unit_price is in cents
        }));
  
        // Send an email through SendGrid
        await this.sendGridService_.sendEmail({
          templateId: "d-8b2d29402c67414fb7293a26f7992c65",
          from: "support@printinc.shop",
          to: order.customer.email, // Corrected to use customer email
          dynamic_template_data: {
            customer: {
              first_name: order.customer.first_name,
            },
            items: itemDetails,
            total: order.total,
            billing_address: order.billing_address,
            downloadUrl: urls[0], // If only one URL is expected, use urls[0]
          },
        });
      }
    }
  }
  
  export default HandleOrderSubscribers;
  