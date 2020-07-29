import React, { Component } from 'react';
import Hoc from '../../hoc/Hoc/Hoc';
import Burger from '../../components/Burger/Burger';
import BuildControls from '../../components/Burger/BuildControls/BuildControls';
import Modal from '../../components/UI/Modal/Modal';
import OrderSummary from '../../components/Burger/OrderSummary/OrderSummary';
import axios from '../../axios-orders'
import Spinner from '../../components/UI/Spinner/Spinner'
import withErrorHandler from '../../hoc/withErrorHandler/withErrorHandler';
import burgerIngredient from '../../components/Burger/BurgerIngredient/BurgerIngredient';

const INGREDIENT_PRICES = {
    salad : 0.5,
    cheese : 0.4,
    meat : 1.3,
    bacon : 0.7
};

class BurgerBuilder extends Component{
    
    constructor(props){
        super(props);
        this.state = {
            ingredients: null,
            totalPrice: 4,
            purchasable: false,
            purchasing: false,
            loading: false,
            error : null
        }
    }

    componentDidMount() {
        axios.get('https://react-my-burger-8a963.firebaseio.com/ingredients.json')
                .then(response => {
                    this.setState({ingredients: response.data})
                })
                .catch(error => {
                    this.setState({error:console.error});
                });
    }

    updatePurchaseState (ingredients) {
        
        const sum = Object.keys( ingredients )
        .map(igKey => {
            return ingredients[igKey];
        })
        .reduce( ( sum, el ) => {
            return sum + el;
        }, 0 );
        this.setState({
            purchasable: sum>0
        });
    }
     

    addIngredientHandler = (type) => {
        //console.log("hi");
        const oldCount = this.state.ingredients[type];
        const updatedCount = oldCount + 1;
        const updatedIngredients = {
            ...this.state.ingredients
        };
        updatedIngredients[type] = updatedCount;
        const priceAddition = INGREDIENT_PRICES[type];
        const oldPrice = this.state.totalPrice;
        const newPrice = oldPrice + priceAddition;
        this.setState({
            ingredients:updatedIngredients,totalPrice : newPrice
        });
        this.updatePurchaseState(updatedIngredients);
    }

    removeIngredientHandler = (type) => {
        console.log("hi");
        const oldCount = this.state.ingredients[type];
        if(oldCount <=0)
        {
            return;
        }
        const updatedCount = oldCount - 1 ;
        const updatedIngredients = {
            ...this.state.ingredients
        };
        updatedIngredients[type] = updatedCount;
        const priceDeduction = INGREDIENT_PRICES[type];
        const oldPrice = this.state.totalPrice;
        const newPrice = oldPrice - priceDeduction;
        this.setState({
            ingredients:updatedIngredients,totalPrice : newPrice
        });
        this.updatePurchaseState(updatedIngredients);
    }

    purchaseHandler = () => {
        this.setState({
            purchasing: true
        });
    }

    purchaseCancelHandler = () => {
        console.log("CLosed");
        this.setState({
            purchasing: false
        });
    }

    purchaseContinueHandler = () => {
        //alert("You continue");
        this.setState({
            loading: true
        });
        const order = {
            ingredients : this.state.ingredients,
            price: this.state.totalPrice,
            customer: {
                name :'Gourav',
                address: {
                    street : 'Test Street',
                    zipCode : '700055',
                    country : 'India'
                },
                email : 'test@test.com'
            },
            deliveryMethod: 'fastest'
        }

        axios.post('/orders.json',order)
             .then(response =>{
                 this.setState({loading: false, purchasing:false});
             })
             .catch(error => {
                this.setState({loading: false, purchasing:false});
             });
    }

    render()
    {
        const disabledInfo = {
            ...this.state.ingredients
        };

        for(let key in disabledInfo)
        {
            disabledInfo[key] = disabledInfo[key] <=0 ;
        }
        let orderSummary = null;

        let burger = this.state.error ? <p>Ingredients can't be loaded!</p> : <Spinner />;

        if(this.state.ingredients)
        {
            burger = (
                <Hoc>
                <Burger ingredients={this.state.ingredients}/>
                    <BuildControls
                     ingredientAdded={this.addIngredientHandler}
                     ingredientRemoved={this.removeIngredientHandler}
                     disabled={disabledInfo}
                     purchasable={this.state.purchasable}
                     price={this.state.totalPrice}
                     ordered={this.purchaseHandler}
                     />
                </Hoc>
            );

            orderSummary = <OrderSummary 
            ingredients={this.state.ingredients} 
            purchaseCanceled={this.purchaseCancelHandler}
            purchaseContinued={this.purchaseContinueHandler}
            price={this.state.totalPrice}
            />;

        }

        if(this.state.loading)
        {
            orderSummary=<Spinner />
        }
        
        return(
            <Hoc>
                <Modal show={this.state.purchasing} modalClosed={this.purchaseCancelHandler}>
                    {orderSummary}
                </Modal>
                {burger}
            </Hoc>
        );
    }
}

export default withErrorHandler(BurgerBuilder, axios);