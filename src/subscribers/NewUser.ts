import {   
    type SubscriberConfig,   
    type SubscriberArgs,  
   } from "@medusajs/medusa"  
     
   export default async function handleAdminCreated({   
    data, eventName, container, pluginOptions,   
   }: SubscriberArgs<Record<string, string>>) {  
    const sendGridService = container.resolve("sendgridService")  
     
    sendGridService.sendEmail({  
    templateId: "admin_confirmation",  
    from: "support@printinc.shop",
    to: data.email,  
    dynamic_template_data: {  
    // any data necessary for your template...  
    first_name: data.first_name,  
    last_name: data.last_name,  
    },  
    })  
   }  
     
   export const config: SubscriberConfig = {  
    event: "invite.created",  
    context: {  
    subscriberId: "admin-created-handler",  
    },  
   }  


