
export const translations = {
    pt: {
        guest: {
            identify: "Como você quer pedir?",
            identify_desc: "Escolha uma opção para continuar",
            delivery: "Delivery",
            delivery_desc: "Receber em casa",
            local: "Comer no Local",
            local_desc: "Mesa ou Balcão",
            pousada: "Na Pousada",
            pousada_desc: "Sou hóspede",
            back: "Voltar",
            name_label: "Seu Nome",
            name_placeholder: "Como podemos te chamar?",
            phone_label: "WhatsApp",
            phone_placeholder: "(00) 00000-0000",
            address_label: "Endereço de Entrega",
            complement_label: "Complemento / Ponto de Referência",
            complement_placeholder: "Ex: Apto 102, Próximo ao mercado...",
            pousada_label: "Selecione sua Pousada",
            pousada_placeholder: "Escolha a pousada...",
            room_label: "Número do Quarto",
            room_placeholder: "Ex: 101",
            table_label: "Mesa ou Quarto", // Updated per request
            table_placeholder: "Ex: Mesa 05 ou Balcão",
            confirm_btn: "CONFIRMAR E PEDIR",
            header: {
                address: "Endereço de Entrega",
                table: "Mesa / Senha",
                room: "Quarto",
                change: "Alterar",
                search: "Buscar no cardápio..."
            },
            categories: {
                all: "Todos"
            },
            product: {
                add: "Adicionar",
                added: "Adicionado!",
                closed: "Fechado"
            },
            cart: {
                title: "Seu Pedido",
                empty: "Seu carrinho está vazio",
                total: "Total",
                checkout: "Finalizar Pedido",
                view_cart: "Ver Carrinho"
            }
        }
    },
    en: {
        guest: {
            identify: "How would you like to order?",
            identify_desc: "Choose an option to continue",
            delivery: "Delivery",
            delivery_desc: "Receive at home",
            local: "Eat Here",
            local_desc: "Table or Counter",
            pousada: "At the Hotel",
            pousada_desc: "I am a guest",
            back: "Back",
            name_label: "Your Name",
            name_placeholder: "What should we call you?",
            phone_label: "WhatsApp",
            phone_placeholder: "(00) 00000-0000",
            address_label: "Delivery Address",
            complement_label: "Complement / Reference",
            complement_placeholder: "Ex: Apt 102, Near market...",
            pousada_label: "Select your Hotel",
            pousada_placeholder: "Choose hotel...",
            room_label: "Room Number",
            room_placeholder: "Ex: 101",
            table_label: "Table or Room",
            table_placeholder: "Ex: Table 05 or Counter",
            confirm_btn: "CONFIRM & ORDER",
            header: {
                address: "Delivery Address",
                table: "Table / Number",
                room: "Room",
                change: "Change",
                search: "Search menu..."
            },
            categories: {
                all: "All"
            },
            product: {
                add: "Add",
                added: "Added!",
                closed: "Closed"
            },
            cart: {
                title: "Your Order",
                empty: "Your cart is empty",
                total: "Total",
                checkout: "Checkout",
                view_cart: "View Cart"
            }
        }
    },
    es: {
        guest: {
            identify: "¿Cómo quieres pedir?",
            identify_desc: "Elige una opción para continuar",
            delivery: "Domicilio",
            delivery_desc: "Recibir en casa",
            local: "Comer Aquí",
            local_desc: "Mesa o Mostrador",
            pousada: "En la Posada",
            pousada_desc: "Soy huésped",
            back: "Volver",
            name_label: "Tu Nombre",
            name_placeholder: "¿Cómo te llamamos?",
            phone_label: "WhatsApp",
            phone_placeholder: "(00) 00000-0000",
            address_label: "Dirección de Entrega",
            complement_label: "Complemento / Referencia",
            complement_placeholder: "Ej: Apto 102, Cerca del mercado...",
            pousada_label: "Selecciona tu Posada",
            pousada_placeholder: "Elige la posada...",
            room_label: "Número de Habitación",
            room_placeholder: "Ej: 101",
            table_label: "Mesa o Habitación",
            table_placeholder: "Ej: Mesa 05 o Mostrador",
            confirm_btn: "CONFIRMAR Y PEDIR",
            header: {
                address: "Dirección de Entrega",
                table: "Mesa / Número",
                room: "Habitación",
                change: "Cambiar",
                search: "Buscar en el menú..."
            },
            categories: {
                all: "Todos"
            },
            product: {
                add: "Agregar",
                added: "¡Agregado!",
                closed: "Cerrado"
            },
            cart: {
                title: "Tu Pedido",
                empty: "Tu carrito está vacío",
                total: "Total",
                checkout: "Finalizar Pedido",
                view_cart: "Ver Carrito"
            }
        }
    }
};

export type Language = 'pt' | 'en' | 'es';
export type Translation = typeof translations.pt;
