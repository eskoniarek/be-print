import { ProductMedia, MediaType } from "src/models/product-media";


const stringType = {
    type: "string",
  };
  
  const objectType = {
    type: "object",
  };
  
  const numberType = {
    type: "number",
  };
  const enumType = {
    type: "enum",
  };
  const booleanType = {
    type: "boolean",
  };
  
  const arrayType = {
    type: "array",
  };
  
  const productMediaObject = {
    ...objectType,
    properties: {
      name: {
        ...stringType,
        description: "Name of the variant.",
      },
      file_key: {
        ...stringType,
        description: "File key of the variant.",
      },
      media_type: {
        ...enumType,
        description: "Main.",
      },
      mime_type: {
        ...stringType,
        description: "MIME type of the variant.",
      },
    },
    required: ["name", "file_key", "mime_type", "variant_id"],
};
  
  export const productMediaTools = [
    {
      type: "function",
      function: {
        name: "propose_product_medias",
        description: "Propose an array of product medias to be added to the store. If no name is specified, ask the user to specify it. If no type is specified, default to 'main'. If no file_key is specified, ask the user to specify it. If no mime_type is specified, ask the user to specify it. If no variant_id is specified, ask the user to specify it. Your output can only contain parameters specified in this function.",
        parameters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the product media. Cannot be empty.",
              },
              type: {
                type: "string",
                description: "Type of the product media. Default is 'main'.",
              },
              file_key: {
                type: "string",
                description: "File key of the product media.",
              },
              mime_type: {
                type: "string",
                description: "MIME type of the product media.",
              },
              variant_id: {
                type: "string",
                description: "Variant ID of the product media.",
              },
            },
            required: ["name", "file_key", "mime_type", "variant_id"],
          },
        },
      },
    },
  ];