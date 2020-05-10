import React, { Component } from "react";
import {
  AuthUserContext,
  withAuthorization,
  withEmailVerification,
} from "../Session";
import { compose } from "recompose";
import { withFirebase } from "../Firebase";
import "bootstrap/dist/css/bootstrap.css";
import defaultPhoto from "../Data/defaultImage.png";
import { Image, List } from "semantic-ui-react";
import Quagga from "../Quagga";

const SearchBarcode = () => {
  return (
    <AuthUserContext.Consumer>
      {(authUser) => (
        <div>
          <ScanBarcode authUser={authUser} />
        </div>
      )}
    </AuthUserContext.Consumer>
  );
};
const initialState = {
  newItems: [],
  itemsList: [],
  results: [],
  value: "",
  isLoading: false,
  isInvalid: true,
};
const todayDate = new Date().toISOString().split("T")[0];
class ScanBarcodeComp extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
  }

  componentDidMount() {
    //import the Items from DB
    this.props.firebase.items().on("value", (snapshot) => {
      const itemsObject = snapshot.val();
      if (itemsObject && itemsObject[this.props.authUser.itemsExpirationKey]) {
        const userItems =
          itemsObject[this.props.authUser.itemsExpirationKey].itemsExpiration;
        this.setState({
          itemsList: userItems,
        });
      }
    });
  }

  componentWillUnmount() {
    this.props.firebase.items().off();
  }

  defaultImage = (e, description) => {
    e.target.src = defaultPhoto;
    const newResults = this.state.results.map((item) => {
      if (description === item.description) {
        item.image = defaultPhoto;
      }
      return item;
    });
    return this.setState({ result: newResults });
  };

  resultRenderer = ({ image, price, title, description }) => [
    image && (
      <div key="image" className="image">
        <Image src={image} onError={(e) => this.defaultImage(e, description)} />
      </div>
    ),
    <div key="content" className="content">
      {price && <div className="price">{price}</div>}
      {title && <div className="title">{title}</div>}
      {description && <div className="description">{description}</div>}
    </div>,
  ];

  scanBarcode = (result) => {
    const imgURL = this.getItemImageURL(result.ItemCode);
    const itemKey = this.props.firebase.item().push().getKey();
    const res = {
      title: result.ItemName,
      description: result.ItemCode,
      image: imgURL,
      expiredDate: todayDate,
      itemKey: itemKey,
    };
    this.setState((prevState) => {
      return {
        newItems: [...prevState.newItems, res],
        value: "",
        results: [],
        isInvalid: false,
      };
    });
  };

  getItemImageURL(barcode) {
    const url = `http://m.pricez.co.il/ProductPictures/${barcode}.jpg`;
    return url;
  }

  changeDate(event, changedItem) {
    const cloneItems = JSON.parse(JSON.stringify(this.state.newItems));
    const currentItem = cloneItems.find(
      (item) => item.itemKey === changedItem.itemKey
    );
    currentItem.expiredDate = event.target.value;
    this.setState({ newItems: cloneItems });
  }

  handleDelete(index) {
    //delete specific item from list
    const { newItems } = this.state;
    const newI = [...newItems];
    newI.splice(index, 1);
    if (newI.length > 0) {
      this.setState({ newItems: newI });
    } else {
      this.setState({ newItems: newI, isInvalid: true });
    }
  }

  handleAdd() {
    const { newItems } = this.state;
    const newI = [...newItems];
    this.setState(
      (prevState) => {
        return {
          itemsList: [...prevState.itemsList, ...newI],
          value: "",
          results: [],
          newItems: [],
        };
      },
      () => {
        this.props.firebase.item(this.props.authUser.itemsExpirationKey).set({
          itemsExpiration: [...this.state.itemsList],
          user: [this.props.authUser.uid],
        });
      }
    );
  }

  render() {
    return (
      <AuthUserContext.Consumer>
        {() => (
          <div id="content">
            <h1 align="center">מוצרים שנסרקו</h1>
            <div className="row m-1">
              <div className="col">
                <Quagga scanBarcode={this.scanBarcode} />
              </div>
              <div className="col">
                <button
                  className="btn btn-primary m-1"
                  onClick={() => this.handleAdd()}
                  disabled={this.state.isInvalid}
                >
                  הוסף למוצרים שלי
                </button>
              </div>
            </div>

            <div className="row m-1">
              {this.state.newItems.length > 0 &&
                this.state.newItems.map((item, index) => {
                  return (
                    <div key={index}>
                      <List celled>
                        <List.Item>
                          <Image
                            avatar
                            style={{ fontSize: 50 }}
                            src={item.image}
                            alt=""
                          />
                          <List.Content>
                            <List.Header>שם המוצר : {item.title}</List.Header>
                            ברקוד: {item.description}
                            <div>
                              <input
                                type="date"
                                id="start"
                                name="trip-start"
                                value={item.expiredDate || todayDate}
                                min={todayDate}
                                onChange={(event) =>
                                  this.changeDate(event, item)
                                }
                              />
                            </div>
                            <button
                              className="negative compact ui button m-1"
                              onClick={() => this.handleDelete(index)}
                            >
                              מחק מוצר
                            </button>
                          </List.Content>
                        </List.Item>
                      </List>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </AuthUserContext.Consumer>
    );
  }
}

const ScanBarcode = withFirebase(ScanBarcodeComp);
const condition = (authUser) => !!authUser;

export default compose(
  withEmailVerification,
  withAuthorization(condition)
)(SearchBarcode);
