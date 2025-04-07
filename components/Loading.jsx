import {ActivityIndicator, View} from 'react-native'
import React, {useContext} from 'react'
import PropTypes from "prop-types";
import {ThemeContext} from "@/context/ThemeProvider";


const Loading = ({size = 'large'}) => {
    const {theme} = useContext(ThemeContext);
    return (
        <View testID={'loading'} style={{justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size={size} color={theme.colors.loading}/>
        </View>
    )
}
Loading.propTypes = {
    size: PropTypes.string,
    color: PropTypes.string
}
export default Loading
