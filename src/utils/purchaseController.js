import CartManager from "../dao/managers_mongo/cartManagerMongo.js";
import ProductManager from "../dao/managers_mongo/productManagerMongo.js";
import { ticketModel } from "../dao/models/ticket.models.js";

const cartManager = new CartManager();
const productManager = new ProductManager();

const purchase = async (req, res) => {
  const { cid } = req.params;
  const purchaser = req.user.user.email;
  try {
    const cart = await cartManager.getCartById(cid);
    if (cart) {
      let amount = 0;

      for (const prod of cart.products) {
        const id = prod.id_prod;
        const prodBD = await productManager.getProductById(id);

        if (prod.quantity <= prodBD.stock) {
          amount += prodBD.price * prod.quantity;
          console.log(`Monto total: ${amount}`);

          prodBD.stock -= prod.quantity;
          const updateProduct = await productManager.updateProduct(
            id,
            prodBD.title,
            prodBD.description,
            prodBD.stock,
            prodBD.status,
            prodBD.code,
            prodBD.price,
            prodBD.category
          );
        }
      }

      const ticketPurchaser = await ticketModel.create({
        amount: amount,
        purchaser: purchaser,
      });
      res.json(ticketPurchaser);

      await cartManager.emptyCart(cid);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error al procesar la solicitud");
  }
};

export default purchase;
