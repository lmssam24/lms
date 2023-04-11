import { useRouter } from "next/router";
import CartService from "./api/cart.service";
const WordpressCart = () => {
  const data = {
    title: "",
    price: "",
    mysql_id: 0,
  };
  const { push } = useRouter();
  function onClicked() {
    CartService.wordpressAddToCart(data)
      .then((res) => {
        if (res && res.status === 200) {
          push("/cart");
        }
      })
      .catch((e) => {
        console.log("Error:::", e);
      });
  }

  return (
    <div>
      <button onClick={onClicked}>Click to add to cart</button>
    </div>
  );
};

export default WordpressCart;
