import {ActivityIndicator, View} from 'react-native'
import React, {useContext} from 'react'
import PropTypes from "prop-types";
import {ThemeContext} from "@/context/ThemeProvider";

const {theme} = useContext(ThemeContext);
const Loading = ({size = 'large', color = theme.colors.loading}) => {
    return (
        <View testID={'loading'} style={{justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size={size} color={color}/>
        </View>
    )
}
Loading.propTypes = {
    size: PropTypes.string,
    color: PropTypes.string
}
export default Loading
