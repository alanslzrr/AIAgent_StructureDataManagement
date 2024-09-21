import streamlit as st
from datetime import datetime
from utils import find_nearest_expiring_certificate
from htmlTemplates import logo_phoenix_base64

def apply_custom_css():
    st.markdown("""
    <style>
    .chat-message {
        padding: 1.5rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        display: flex;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);  
    }
    .chat-message.user {
        background-color: var(--primary-color);
        opacity: 0.7;
    }
    .chat-message.bot {
        background-color: var(--secondary-background-color);
    }
    .chat-message .avatar {
        width: 15%;
    }
    .chat-message .avatar img {
        max-width: 50px;
        max-height: 50px;
        border-radius: 50%;
        object-fit: cover;
    }
    .chat-message .message {
        width: 85%;
        padding: 0 1.5rem;
        color: var(--text-color);
    }
    .sidebar .quick-info {
        background-color: var(--secondary-background-color);
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
    }
    .info-item {
        margin-bottom: 0.8rem;
    }
    .info-label {
        font-weight: bold;
        color: var(--primary-color);
        display: block;
        margin-bottom: 0.2rem;
    }
    .info-value {
        display: block;
        margin-left: 0.5rem;
    }
    </style>
    """, unsafe_allow_html=True)

def render_chat_message(message):
    if message["role"] == "user":
        st.markdown(f"""
        <div class="chat-message user">
            <div class="avatar">
                <img src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y">
            </div>    
            <div class="message">{message["content"]}</div>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown(f"""
        <div class="chat-message bot">
            <div class="avatar">
                <img src="data:image/png;base64,{logo_phoenix_base64}">
            </div>    
            <div class="message">{message["content"]}</div>
        </div>
        """, unsafe_allow_html=True)

def render_quick_info():
    st.markdown("<h3>Quick Information</h3>", unsafe_allow_html=True)
    with st.container():
        st.markdown("<div class='quick-info'>", unsafe_allow_html=True)
        
        if 'collection' in st.session_state and st.session_state.collection is not None:
            try:
                cert_info = find_nearest_expiring_certificate(st.session_state.collection)
                
                if cert_info['Type'] == "Nearest Expiring":
                    st.markdown("<h4>Next Certificate to Expire</h4>", unsafe_allow_html=True)
                    for key, value in cert_info.items():
                        if key not in ['Type', 'Days until expiration']:
                            st.markdown(f"""
                                <div class='info-item'>
                                    <span class='info-label'>{key}</span>
                                    <span class='info-value'>{value}</span>
                                </div>
                            """, unsafe_allow_html=True)
                    st.markdown(f"""
                        <div class='info-item'>
                            <span class='info-label'>Time until expiration</span>
                            <span class='info-value'>{cert_info['Days until expiration']} Days</span>
                        </div>
                    """, unsafe_allow_html=True)
                elif cert_info['Type'] == "Last Expired":
                    st.markdown("<h4>Last Expired Certificate</h4>", unsafe_allow_html=True)
                    for key, value in cert_info.items():
                        if key not in ['Type', 'Days since expiration']:
                            st.markdown(f"""
                                <div class='info-item'>
                                    <span class='info-label'>{key}</span>
                                    <span class='info-value'>{value}</span>
                                </div>
                            """, unsafe_allow_html=True)
                    st.markdown(f"""
                        <div class='info-item'>
                            <span class='info-label'>Time since expiration</span>
                            <span class='info-value'>{cert_info['Days since expiration']} Days</span>
                        </div>
                    """, unsafe_allow_html=True)
                    st.markdown("""
                        <div class='info-item' style='margin-top: 10px; font-style: italic; color: #ff0000;'>
                            <span class='info-value'>Note: There are no certificates expiring soon.</span>
                        </div>
                    """, unsafe_allow_html=True)
                else:
                    st.markdown("<h4>No Certificates</h4>", unsafe_allow_html=True)
                    st.markdown(f"""
                        <div class='info-item'>
                            <span class='info-value'>{cert_info['Status']}</span>
                        </div>
                    """, unsafe_allow_html=True)
            except Exception as e:
                st.error(f"Error fetching certificate info: {str(e)}")
        else:
            st.markdown("""
                <div class='info-item'>
                    <span class='info-label'>Status</span>
                    <span class='info-value'>Database connection not established</span>
                </div>
            """, unsafe_allow_html=True)
        
        current_month = datetime.now().strftime("%B")
        st.markdown(f"""
            <div class='info-item'>
                <span class='info-label'>Current month</span>
                <span class='info-value'>{current_month}</span>
            </div>
        """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)